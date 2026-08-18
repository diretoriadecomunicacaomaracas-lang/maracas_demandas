-- =====================================================================
-- PATCH_0007_busca_e_visibilidade.sql
-- Rodada 1 de reestruturação — Busca global + Visibilidade de mensagens.
--
-- OBJETIVO
--   (1) Busca global acento-insensível, parcial e multi-palavra, com RLS
--       respeitada (SECURITY INVOKER): ninguém encontra o que não pode ver.
--       Cobre também nomes (secretaria, setor, solicitante, responsável,
--       colaboradores) e a demanda principal (título, descrição, briefing
--       consolidado e protocolo próprio — inclusive demandas internas).
--   (2) Coluna `visibilidade` em solicitacao_mensagens separando mensagens
--       públicas (solicitante + interno autorizado) de internas (só interno
--       autorizado). Segurança 100% no RLS + trigger — não depende da UI.
--
-- CARACTERÍSTICAS
--   * 100% IDEMPOTENTE (pode rodar mais de uma vez com segurança).
--   * NÃO apaga dados, NÃO remove tabelas, NÃO altera .env.
--   * Reutiliza helpers existentes: is_interno(), minha_secretaria(),
--     has_perm('moderar_conversa'). Não duplica leitura da matriz de cargos.
--   * Índices de expressão usam apenas funções IMUTÁVEIS (|| explícito).
--   * Nenhuma função usa service_role.
--
-- ATENÇÃO: NÃO EXECUTAR sem autorização. Rodar no SQL Editor do Supabase
--          (owner/postgres). As extensões abaixo exigem privilégio.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) EXTENSÕES + f_unaccent imutável
-- ---------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = pg_catalog, extensions, public
as $$ select extensions.unaccent('extensions.unaccent', $1) $$;

-- ---------------------------------------------------------------------
-- 2) ALTERAÇÕES DE SCHEMA (aditivas e idempotentes)
-- ---------------------------------------------------------------------

-- 2.a) Protocolo próprio da DEMANDA (inclusive internas sem solicitação).
--      Formato: 'D-2026-0001'. Sequência dedicada; backfill dos existentes.
create sequence if not exists public.demanda_protocolo_seq;
alter table public.demandas add column if not exists protocolo text;
update public.demandas
   set protocolo = 'D-2026-' || lpad(nextval('public.demanda_protocolo_seq')::text, 4, '0')
 where protocolo is null;
alter table public.demandas
  alter column protocolo set default ('D-2026-' || lpad(nextval('public.demanda_protocolo_seq')::text, 4, '0'));
create unique index if not exists demandas_protocolo_key on public.demandas(protocolo);

-- 2.b) Visibilidade das mensagens (publica | interna). Default preserva as
--      mensagens existentes como públicas.
alter table public.solicitacao_mensagens
  add column if not exists visibilidade text not null default 'publica';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'solic_msg_visibilidade_chk') then
    alter table public.solicitacao_mensagens
      add constraint solic_msg_visibilidade_chk check (visibilidade in ('publica','interna'));
  end if;
end $$;
create index if not exists idx_solic_msg_visib
  on public.solicitacao_mensagens (solicitacao_id, visibilidade);

-- ---------------------------------------------------------------------
-- 3) ÍNDICES GIN TRIGRAM — expressões IMUTÁVEIS (|| explícito, sem concat_ws)
-- ---------------------------------------------------------------------
create index if not exists idx_busca_solicitacoes on public.solicitacoes
  using gin (public.f_unaccent(
    coalesce(protocolo,'') || ' ' || coalesce(titulo,'') || ' ' ||
    coalesce(descricao,'') || ' ' || coalesce(briefing_interno,'')
  ) extensions.gin_trgm_ops);

create index if not exists idx_busca_demandas on public.demandas
  using gin (public.f_unaccent(
    coalesce(protocolo,'') || ' ' || coalesce(titulo,'') || ' ' ||
    coalesce(descricao,'') || ' ' || coalesce(briefing_consolidado,'')
  ) extensions.gin_trgm_ops);

-- conteudo (jsonb) fica FORA do índice para garantir imutabilidade;
-- continua pesquisável via RPC (busca_match sobre conteudo::text).
create index if not exists idx_busca_subdemandas on public.subdemandas
  using gin (public.f_unaccent(
    coalesce(titulo,'') || ' ' || coalesce(area,'') || ' ' ||
    coalesce(resumo,'') || ' ' || coalesce(observacoes,'')
  ) extensions.gin_trgm_ops);

create index if not exists idx_busca_comentarios on public.comentarios
  using gin (public.f_unaccent(coalesce(conteudo,'')) extensions.gin_trgm_ops);

create index if not exists idx_busca_links on public.links_drive
  using gin (public.f_unaccent(
    coalesce(titulo,'') || ' ' || coalesce(descricao,'') || ' ' || coalesce(url,'')
  ) extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 4) MATCH MULTI-PALAVRA (todos os termos; parcial; sem acento)
-- ---------------------------------------------------------------------
create or replace function public.busca_match(haystack text, termo text)
returns boolean
language sql
immutable
parallel safe
set search_path = pg_catalog, public, extensions
as $$
  select coalesce((
    select bool_and(public.f_unaccent(haystack) ilike '%' || public.f_unaccent(tok) || '%')
    from unnest(string_to_array(regexp_replace(btrim(termo), '\s+', ' ', 'g'), ' ')) as tok
    where tok <> ''
  ), false);
$$;

-- ---------------------------------------------------------------------
-- 5) AUTORIZAÇÃO — participação do INTERNO numa solicitação
--    SECURITY DEFINER: lê com segurança as tabelas envolvidas (sem depender
--    da RLS do chamador) e evita qualquer recursão de política. Retorna só
--    boolean. Reutiliza has_perm('moderar_conversa') (não duplica cargos).
-- ---------------------------------------------------------------------
create or replace function public.pode_participar_solic(p_solic uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_interno() and (
    public.has_perm('moderar_conversa')
    or exists (
      select 1 from public.solicitacao_autorizados sa
      where sa.solicitacao_id = p_solic and sa.usuario_id = auth.uid()
    )
    or exists (
      select 1 from public.demandas d
      join public.subdemandas sd on sd.demanda_id = d.id
      left join public.subdemanda_membros m on m.subdemanda_id = sd.id
      where d.solicitacao_id = p_solic
        and (sd.responsavel_id = auth.uid() or m.usuario_id = auth.uid())
    )
  );
$$;

-- ---------------------------------------------------------------------
-- 6) RPC busca_global — SECURITY INVOKER (RLS respeitada por construção)
--    Categorias: solicitacao | demanda | conteudo | comentario | link.
--    URLs de demanda apontam para a SUBDEMANDA (a página /app/demandas/[id]
--    abre a subdemanda). Mensagens NÃO são indexadas → busca jamais retorna
--    mensagem interna.
-- ---------------------------------------------------------------------
create or replace function public.busca_global(
  termo          text,
  p_secretaria   uuid        default null,
  p_tipo         text        default null,
  p_status       text        default null,
  p_prioridade   text        default null,
  p_profissional uuid        default null,
  p_de           timestamptz default null,
  p_ate          timestamptz default null
)
returns table (
  categoria     text,
  id            uuid,
  protocolo     text,
  titulo        text,
  corpo         text,
  data          timestamptz,
  secretaria_id uuid,
  status        text,
  prioridade    text,
  url           text
)
language sql
stable
security invoker            -- NUNCA SECURITY DEFINER aqui (quebraria a RLS)
set search_path = pg_catalog, public, extensions
as $$
  -- SOLICITAÇÕES (+ nomes de secretaria, setor e solicitante)
  select 'solicitacao'::text, s.id, s.protocolo, s.titulo,
         left(concat_ws(' ', s.descricao, s.briefing_interno), 2000),
         s.created_at, s.secretaria_id, s.status_externo, null::text,
         '/app/solicitacoes/' || s.id
  from public.solicitacoes s
  left join public.secretarias sec on sec.id = s.secretaria_id
  left join public.unidades    uni on uni.id = s.unidade_id
  left join public.usuarios    cri on cri.id = s.criado_por
  where s.deleted_at is null
    and public.busca_match(
          concat_ws(' ', s.protocolo, s.titulo, s.descricao, s.briefing_interno,
                         sec.nome, uni.nome, cri.nome), termo)
    and (p_secretaria   is null or s.secretaria_id = p_secretaria)
    and (p_tipo         is null or s.tipo::text = p_tipo)
    and (p_status       is null or s.status_externo = p_status)
    and (p_prioridade   is null)      -- solicitação não tem prioridade
    and (p_profissional is null)      -- não se aplica
    and (p_de           is null or s.created_at >= p_de)
    and (p_ate          is null or s.created_at <= p_ate)

  union all
  -- DEMANDAS (subdemanda/tarefa + demanda principal + nomes de equipe)
  select 'demanda', sd.id, coalesce(d.protocolo, so.protocolo), sd.titulo,
         left(concat_ws(' ', sd.resumo, sd.observacoes, sd.area, d.titulo, d.descricao), 2000),
         coalesce(sd.updated_at, sd.created_at), sd.secretaria_id, sd.etapa, sd.prioridade::text,
         '/app/demandas/' || sd.id
  from public.subdemandas sd
  join public.demandas d on d.id = sd.demanda_id
  left join public.solicitacoes so on so.id = d.solicitacao_id
  left join public.secretarias sec on sec.id = sd.secretaria_id
  left join public.unidades    uni on uni.id = d.unidade_id
  left join public.usuarios    ur  on ur.id  = sd.responsavel_id
  where sd.deleted_at is null
    and public.busca_match(
          concat_ws(' ',
            sd.titulo, sd.area, sd.resumo, sd.observacoes,
            d.protocolo, d.titulo, d.descricao, d.briefing_consolidado,
            sec.nome, uni.nome, ur.nome,
            (select string_agg(cu.nome, ' ')
               from public.subdemanda_membros mm
               join public.usuarios cu on cu.id = mm.usuario_id
              where mm.subdemanda_id = sd.id)
          ), termo)
    and (p_secretaria   is null or sd.secretaria_id = p_secretaria)
    and (p_tipo         is null or sd.tipo::text = p_tipo)
    and (p_status       is null or sd.etapa = p_status)
    and (p_prioridade   is null or sd.prioridade::text = p_prioridade)
    and (p_profissional is null
         or sd.responsavel_id = p_profissional
         or exists (select 1 from public.subdemanda_membros mm
                    where mm.subdemanda_id = sd.id and mm.usuario_id = p_profissional))
    and (p_de           is null or coalesce(sd.updated_at, sd.created_at) >= p_de)
    and (p_ate          is null or coalesce(sd.updated_at, sd.created_at) <= p_ate)

  union all
  -- CONTEÚDOS (conteúdo operacional jsonb: roteiro, legenda, texto de card, hashtags…)
  select 'conteudo', sd.id, coalesce(d.protocolo, so.protocolo), sd.titulo,
         left(sd.conteudo::text, 2000),
         coalesce(sd.updated_at, sd.created_at), sd.secretaria_id, sd.etapa, sd.prioridade::text,
         '/app/demandas/' || sd.id
  from public.subdemandas sd
  join public.demandas d on d.id = sd.demanda_id
  left join public.solicitacoes so on so.id = d.solicitacao_id
  where sd.deleted_at is null
    and coalesce(sd.conteudo::text,'') <> '{}'
    and public.busca_match(coalesce(sd.conteudo::text,''), termo)
    and (p_secretaria   is null or sd.secretaria_id = p_secretaria)
    and (p_tipo         is null or sd.tipo::text = p_tipo)
    and (p_status       is null or sd.etapa = p_status)
    and (p_prioridade   is null or sd.prioridade::text = p_prioridade)
    and (p_profissional is null
         or sd.responsavel_id = p_profissional
         or exists (select 1 from public.subdemanda_membros mm
                    where mm.subdemanda_id = sd.id and mm.usuario_id = p_profissional))
    and (p_de           is null or coalesce(sd.updated_at, sd.created_at) >= p_de)
    and (p_ate          is null or coalesce(sd.updated_at, sd.created_at) <= p_ate)

  union all
  -- COMENTÁRIOS (internos; RLS is_interno() já barra o solicitante) + autor
  select 'comentario', c.id, coalesce(d.protocolo, so.protocolo), sd.titulo,
         left(c.conteudo, 2000),
         c.created_at, sd.secretaria_id, sd.etapa, sd.prioridade::text,
         '/app/demandas/' || sd.id
  from public.comentarios c
  join public.subdemandas sd on sd.id = c.subdemanda_id
  join public.demandas d on d.id = sd.demanda_id
  left join public.solicitacoes so on so.id = d.solicitacao_id
  left join public.usuarios ca on ca.id = c.autor_id
  where c.deleted_at is null
    and public.busca_match(concat_ws(' ', c.conteudo, ca.nome), termo)
    and (p_secretaria   is null or sd.secretaria_id = p_secretaria)
    and (p_tipo         is null or sd.tipo::text = p_tipo)
    and (p_status       is null or sd.etapa = p_status)
    and (p_prioridade   is null or sd.prioridade::text = p_prioridade)
    and (p_profissional is null
         or sd.responsavel_id = p_profissional
         or exists (select 1 from public.subdemanda_membros mm
                    where mm.subdemanda_id = sd.id and mm.usuario_id = p_profissional))
    and (p_de           is null or c.created_at >= p_de)
    and (p_ate          is null or c.created_at <= p_ate)

  union all
  -- LINKS DE REFERÊNCIA
  select 'link', l.id, coalesce(d.protocolo, so.protocolo), coalesce(nullif(l.titulo,''), l.tipo),
         left(concat_ws(' ', l.descricao, l.url), 2000),
         l.created_at, sd.secretaria_id, sd.etapa, sd.prioridade::text,
         '/app/demandas/' || sd.id
  from public.links_drive l
  join public.subdemandas sd on sd.id = l.subdemanda_id
  join public.demandas d on d.id = sd.demanda_id
  left join public.solicitacoes so on so.id = d.solicitacao_id
  where l.deleted_at is null
    and public.busca_match(concat_ws(' ', l.titulo, l.descricao, l.url), termo)
    and (p_secretaria   is null or sd.secretaria_id = p_secretaria)
    and (p_tipo         is null or sd.tipo::text = p_tipo)
    and (p_status       is null or sd.etapa = p_status)
    and (p_prioridade   is null or sd.prioridade::text = p_prioridade)
    and (p_profissional is null
         or sd.responsavel_id = p_profissional
         or exists (select 1 from public.subdemanda_membros mm
                    where mm.subdemanda_id = sd.id and mm.usuario_id = p_profissional))
    and (p_de           is null or l.created_at >= p_de)
    and (p_ate          is null or l.created_at <= p_ate)

  order by data desc nulls last
  limit 300;
$$;

-- ---------------------------------------------------------------------
-- 7) PERMISSÕES DAS FUNÇÕES — revogar de public/anon; conceder a authenticated.
--    (Funções de autorização não ficam expostas a anon.)
-- ---------------------------------------------------------------------
revoke all on function public.f_unaccent(text) from public, anon;
grant  execute on function public.f_unaccent(text) to authenticated;

revoke all on function public.busca_match(text, text) from public, anon;
grant  execute on function public.busca_match(text, text) to authenticated;

revoke all on function public.pode_participar_solic(uuid) from public, anon;
grant  execute on function public.pode_participar_solic(uuid) to authenticated;

revoke all on function public.busca_global(text, uuid, text, text, text, uuid, timestamptz, timestamptz) from public, anon;
grant  execute on function public.busca_global(text, uuid, text, text, text, uuid, timestamptz, timestamptz) to authenticated;

-- =====================================================================
-- 8) SEGURANÇA DAS MENSAGENS — RLS + trigger (defesa no banco)
-- =====================================================================
alter table public.solicitacao_mensagens enable row level security;

-- Trigger: normaliza campos e torna imutáveis os campos sensíveis.
--   INSERT → origem coerente com o ambiente (não confia no cliente);
--            autor_id = usuário autenticado.
--   UPDATE → solicitacao_id, autor_id, origem e created_at NÃO mudam.
--   (conteudo e visibilidade permanecem editáveis, sujeitos ao RLS.)
create or replace function public.tg_solic_msg_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if TG_OP = 'INSERT' then
    new.autor_id := auth.uid();
    new.origem   := case when public.is_interno() then 'interno'::ambiente
                         else 'solicitante'::ambiente end;
  elsif TG_OP = 'UPDATE' then
    new.solicitacao_id := old.solicitacao_id;
    new.autor_id       := old.autor_id;
    new.origem         := old.origem;
    new.created_at     := old.created_at;
  end if;
  return new;
end $$;

drop trigger if exists trg_solic_msg_guard on public.solicitacao_mensagens;
create trigger trg_solic_msg_guard
  before insert or update on public.solicitacao_mensagens
  for each row execute function public.tg_solic_msg_guard();

-- Remove TODAS as policies antigas desta tabela (inclui a antiga insert ampla).
drop policy if exists solic_msg_select on public.solicitacao_mensagens;
drop policy if exists solic_msg_insert on public.solicitacao_mensagens;
drop policy if exists solic_msg_update on public.solicitacao_mensagens;

-- SELECT
--   • Interno: só se PARTICIPA (moderador, autorizado ou atribuído) —
--     nunca só por is_interno(). Vê públicas e internas.
--   • Solicitante: só 'publica', só solicitações que ele PODE VER
--     (mesma secretaria + não restrita, ou criador, ou autorizado).
--   → contadores/trechos/metadados do solicitante NUNCA revelam interna.
create policy solic_msg_select on public.solicitacao_mensagens for select using (
  public.pode_participar_solic(solicitacao_mensagens.solicitacao_id)
  or (
    visibilidade = 'publica'
    and not public.is_interno()
    and exists (
      select 1 from public.solicitacoes s
      where s.id = solicitacao_mensagens.solicitacao_id
        and s.secretaria_id = public.minha_secretaria()
        and (
          s.restrita = false
          or s.criado_por = auth.uid()
          or exists (
            select 1 from public.solicitacao_autorizados sa
            where sa.solicitacao_id = s.id and sa.usuario_id = auth.uid()
          )
        )
    )
  )
);

-- INSERT
--   • 'interna': exige has_perm('moderar_conversa') E participação.
--   • 'publica' por INTERNO: exige participação.
--   • 'publica' pelo SOLICITANTE: própria autoria + solicitação que ele
--     PODE VER (respeita restrita — não basta conhecer o UUID).
--   Solicitante NUNCA insere 'interna' (nenhum ramo permite).
--   (autor_id/origem já são forçados pelo trigger; o RLS confirma.)
create policy solic_msg_insert on public.solicitacao_mensagens for insert with check (
  autor_id = auth.uid()
  and (
    (visibilidade = 'interna'
      and public.has_perm('moderar_conversa')
      and public.pode_participar_solic(solicitacao_id))
    or
    (visibilidade = 'publica'
      and public.pode_participar_solic(solicitacao_id))
    or
    (visibilidade = 'publica'
      and not public.is_interno()
      and exists (
        select 1 from public.solicitacoes s
        where s.id = solicitacao_id
          and s.secretaria_id = public.minha_secretaria()
          and (
            s.restrita = false
            or s.criado_por = auth.uid()
            or exists (
              select 1 from public.solicitacao_autorizados sa
              where sa.solicitacao_id = s.id and sa.usuario_id = auth.uid()
            )
          )
      ))
  )
);

-- UPDATE (USING = alcance; WITH CHECK = resultado permitido)
--   • Moderador participante: modera públicas e internas.
--   • Interno participante: edita a PRÓPRIA pública.
--   • Solicitante: edita a PRÓPRIA pública de solicitação que PODE VER, e
--     JAMAIS a torna interna (bloqueado no USING e no WITH CHECK).
--   • Interno sem moderação NÃO alcança nem produz mensagem interna.
create policy solic_msg_update on public.solicitacao_mensagens for update
using (
  (public.has_perm('moderar_conversa') and public.pode_participar_solic(solicitacao_id))
  or (autor_id = auth.uid() and visibilidade = 'publica' and (
        public.pode_participar_solic(solicitacao_id)
        or (not public.is_interno() and exists (
              select 1 from public.solicitacoes s
              where s.id = solicitacao_id
                and s.secretaria_id = public.minha_secretaria()
                and (s.restrita = false or s.criado_por = auth.uid()
                     or exists (select 1 from public.solicitacao_autorizados sa
                                where sa.solicitacao_id = s.id and sa.usuario_id = auth.uid()))))
     ))
)
with check (
  (visibilidade = 'interna'
     and public.has_perm('moderar_conversa')
     and public.pode_participar_solic(solicitacao_id))
  or (visibilidade = 'publica' and (
        (public.has_perm('moderar_conversa') and public.pode_participar_solic(solicitacao_id))
        or (autor_id = auth.uid() and public.pode_participar_solic(solicitacao_id))
        or (autor_id = auth.uid() and not public.is_interno() and exists (
              select 1 from public.solicitacoes s
              where s.id = solicitacao_id
                and s.secretaria_id = public.minha_secretaria()
                and (s.restrita = false or s.criado_por = auth.uid()
                     or exists (select 1 from public.solicitacao_autorizados sa
                                where sa.solicitacao_id = s.id and sa.usuario_id = auth.uid()))))
     ))
);

-- (Sem policy de DELETE → exclusão negada por padrão; histórico preservado.)

-- =====================================================================
-- RESUMO DAS ALTERAÇÕES (ver também a mensagem de entrega)
--   Campos:    demandas.protocolo ; solicitacao_mensagens.visibilidade
--   Sequência: demanda_protocolo_seq
--   Índices:   demandas_protocolo_key, idx_solic_msg_visib,
--              idx_busca_solicitacoes, idx_busca_demandas,
--              idx_busca_subdemandas, idx_busca_comentarios, idx_busca_links
--   Funções:   f_unaccent, busca_match, pode_participar_solic, busca_global,
--              tg_solic_msg_guard  (pode_moderar_conversa REMOVIDA → has_perm)
--   Triggers:  trg_solic_msg_guard (BEFORE INSERT/UPDATE)
--   Policies:  solic_msg_select / solic_msg_insert / solic_msg_update
--              (antigas removidas antes; inclui a insert ampla legada)
-- =====================================================================
-- FIM DO PATCH_0007
-- =====================================================================
