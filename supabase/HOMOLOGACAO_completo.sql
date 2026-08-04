-- =============================================================
-- HOMOLOGACAO_completo.sql — cole tudo no SQL Editor do Supabase
-- Ordem: schema, funcoes/triggers, RLS, drive/impressao, seed (referencia).
-- Depois rode: npx tsx scripts/seed-demo-users.ts (cria usuarios de auth).
-- =============================================================

-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0001_schema.sql <<<<<<<<<<<<<<<<<<<<
-- =====================================================================
-- 0001_schema.sql — Esquema base (MVP) — Gestão de Demandas / Maracás
-- Fonte oficial das regras: Especificação v2.2.
-- Convenções: soft delete (deleted_at); timestamps em timestamptz (UTC);
-- exibição no fuso America/Sao_Paulo é responsabilidade da aplicação.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
create type ambiente as enum ('interno','solicitante','grafica');
create type situacao_conta as enum ('aguardando_ativacao','ativa','inativa');
create type tipo_demanda as enum ('digital','audiovisual','impresso');
create type prioridade as enum ('baixa','media','alta','emergencial');
create type decisao_aprovacao as enum ('aprovar','aprovar_com_observacao','solicitar_correcao','reprovar');
create type tipo_liberacao as enum ('publicacao','impressao');
create type estado_versao as enum ('rascunho','em_revisao','correcao_solicitada','substituida','aprovada','liberada_publicacao','liberada_impressao','cancelada');
create type situacao_demanda as enum ('ativa','arquivada','excluida_logicamente');
create type canal_notificacao as enum ('interno','email');
create type situacao_email as enum ('pendente','enviado','falha');

-- ---------- INSTITUCIONAL ----------
create table cargos (
  id uuid primary key default gen_random_uuid(),
  chave text unique not null,              -- ex.: 'diretor','coordenador','designer'
  nome text not null,
  inicial boolean not null default false,  -- cargo do conjunto inicial (não removível)
  created_at timestamptz not null default now()
);

create table permissoes (
  id uuid primary key default gen_random_uuid(),
  chave text unique not null,              -- ex.: 'aprovar_digital','liberar_impressao'
  descricao text not null,
  critica boolean not null default false   -- permissão crítica protegida por regra de negócio
);

create table cargo_permissoes (
  cargo_id uuid references cargos(id) on delete cascade,
  permissao_id uuid references permissoes(id) on delete cascade,
  primary key (cargo_id, permissao_id)
);

create table secretarias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table unidades (
  id uuid primary key default gen_random_uuid(),
  secretaria_id uuid not null references secretarias(id) on delete restrict,
  nome text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table graficas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato_email text,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Perfil do usuário (1:1 com auth.users do Supabase)
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text unique not null,
  telefone text,
  ambiente_principal ambiente not null default 'interno',
  secretaria_id uuid references secretarias(id),   -- quando solicitante
  unidade_id uuid references unidades(id),
  grafica_id uuid references graficas(id),          -- quando gráfica
  situacao situacao_conta not null default 'aguardando_ativacao',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table usuario_cargos (               -- um usuário pode acumular cargos
  usuario_id uuid references usuarios(id) on delete cascade,
  cargo_id uuid references cargos(id) on delete cascade,
  primary key (usuario_id, cargo_id)
);

-- Convites (link de uso único, validade 24h)
create table convites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text not null,
  cargo_id uuid references cargos(id),
  secretaria_id uuid references secretarias(id),
  unidade_id uuid references unidades(id),
  grafica_id uuid references graficas(id),
  token_hash text not null,                -- hash do token; token real só no e-mail
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_por uuid references usuarios(id),
  created_at timestamptz not null default now()
);

create table grupos_operacionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,                      -- Geral, Coordenação, Criação, ...
  created_at timestamptz not null default now()
);
create table usuario_grupos_operacionais (
  usuario_id uuid references usuarios(id) on delete cascade,
  grupo_id uuid references grupos_operacionais(id) on delete cascade,
  primary key (usuario_id, grupo_id)
);

-- ---------- SOLICITAÇÕES (Portal do Solicitante) ----------
create sequence if not exists protocolo_seq;
create table solicitacoes (
  id uuid primary key default gen_random_uuid(),
  protocolo text unique not null default ('2026-' || lpad(nextval('protocolo_seq')::text,4,'0')),
  titulo text not null,
  descricao text,
  tipo tipo_demanda,
  canal text,
  secretaria_id uuid not null references secretarias(id),
  unidade_id uuid references unidades(id),
  criado_por uuid not null references usuarios(id),
  prazo_desejado timestamptz,              -- deve respeitar +24h (validado na app + trigger)
  restrita boolean not null default false, -- exceção de visibilidade
  status_externo text not null default 'enviada',
  resultado text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table solicitacao_mensagens (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references solicitacoes(id) on delete cascade,
  autor_id uuid not null references usuarios(id),
  origem ambiente not null,                -- 'solicitante' ou 'interno'
  conteudo text not null,
  created_at timestamptz not null default now()
);
create table solicitacao_autorizados (     -- internos explicitamente autorizados a ver restrita
  solicitacao_id uuid references solicitacoes(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  primary key (solicitacao_id, usuario_id)
);

-- ---------- DEMANDAS / SUBDEMANDAS ----------
create table demandas (                      -- demanda principal / campanha
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  campanha boolean not null default false,
  descricao text,
  solicitacao_id uuid references solicitacoes(id),
  prioridade prioridade not null default 'media',
  situacao situacao_demanda not null default 'ativa',
  finalizada_em timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table subdemandas (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid not null references demandas(id) on delete cascade,
  titulo text not null,
  tipo tipo_demanda not null,
  area text,
  responsavel_id uuid references usuarios(id),
  prioridade prioridade not null default 'media',
  etapa text not null default 'planejamento',      -- etapa específica (camada 2)
  macroetapa text not null default 'planejamento',  -- camada 1
  prazo timestamptz,
  data_publicacao timestamptz,
  canal text,
  secretaria_id uuid references secretarias(id),
  situacao situacao_demanda not null default 'ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table subdemanda_membros (
  subdemanda_id uuid references subdemandas(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  primary key (subdemanda_id, usuario_id)
);

create table checklists (
  id uuid primary key default gen_random_uuid(),
  subdemanda_id uuid not null references subdemandas(id) on delete cascade,
  descricao text not null,
  concluido boolean not null default false,
  ordem int not null default 0
);

create table comentarios (                    -- comentários internos da demanda
  id uuid primary key default gen_random_uuid(),
  subdemanda_id uuid not null references subdemandas(id) on delete cascade,
  autor_id uuid not null references usuarios(id),
  conteudo text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- LINKS (Google Drive) e VERSÕES ----------
create table versoes (
  id uuid primary key default gen_random_uuid(),
  subdemanda_id uuid not null references subdemandas(id) on delete cascade,
  numero int not null,                        -- V1, V2 ...
  titulo text,
  link_drive text not null,                   -- link próprio e único por versão
  autor_id uuid references usuarios(id),
  observacao text,
  estado estado_versao not null default 'rascunho',
  vigente boolean not null default false,
  created_at timestamptz not null default now(),
  unique (subdemanda_id, numero)
);
-- Regra: nenhuma versão ATIVA (não substituída/cancelada) pode repetir link.
create unique index versoes_link_unico_ativo
  on versoes(link_drive) where estado not in ('substituida','cancelada');

create table links_drive (                    -- demais links (briefing, referência, brutos...)
  id uuid primary key default gen_random_uuid(),
  subdemanda_id uuid not null references subdemandas(id) on delete cascade,
  tipo text not null,                          -- briefing | referencia | trabalho | bruto | comprovante | publicacao | foto
  titulo text,
  descricao text,
  url text not null,
  autor_id uuid references usuarios(id),
  created_at timestamptz not null default now()
);

-- ---------- APROVAÇÕES / LIBERAÇÕES ----------
create table aprovacoes (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references versoes(id) on delete cascade,
  usuario_id uuid not null references usuarios(id),
  cargo_chave text not null,                   -- 'diretor' | 'coordenador'
  decisao decisao_aprovacao not null,
  observacao text,
  ativa boolean not null default true,          -- invalidada por nova versão
  created_at timestamptz not null default now()
);

create table liberacoes (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references versoes(id) on delete cascade,
  tipo tipo_liberacao not null,
  usuario_id uuid not null references usuarios(id),
  cargo_chave text not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- IMPRESSOS / PORTAL DA GRÁFICA ----------
create table pedidos_impressao (
  id uuid primary key default gen_random_uuid(),
  subdemanda_id uuid not null references subdemandas(id) on delete cascade,
  grafica_id uuid references graficas(id),
  versao_liberada_id uuid references versoes(id),
  quantidade text, medidas text, formato text, material text, acabamento text,
  local_entrega text, observacoes text,
  prazo timestamptz,
  status text not null default 'aguardando_confirmacao',
  created_at timestamptz not null default now()
);
create table confirmacoes_grafica (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_impressao(id) on delete cascade,
  versao_id uuid not null references versoes(id),
  usuario_id uuid not null references usuarios(id),
  grafica_id uuid references graficas(id),
  ativa boolean not null default true,          -- invalidada em substituição de versão
  created_at timestamptz not null default now()
);
create table pedido_mensagens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_impressao(id) on delete cascade,
  autor_id uuid not null references usuarios(id),
  origem ambiente not null,
  conteudo text not null,
  created_at timestamptz not null default now()
);

-- ---------- CALENDÁRIO ----------
create table eventos_calendario (
  id uuid primary key default gen_random_uuid(),
  subdemanda_id uuid references subdemandas(id) on delete cascade,
  titulo text not null,
  inicio timestamptz not null,                  -- armazenado em UTC; exibir em America/Sao_Paulo
  duracao_min int,
  canal text,
  status text,
  created_at timestamptz not null default now()
);

-- ---------- NOTIFICAÇÕES ----------
create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references usuarios(id) on delete cascade,
  canal canal_notificacao not null default 'interno',
  tipo text not null,
  titulo text not null,
  referencia_url text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create table emails_enviados (
  id uuid primary key default gen_random_uuid(),
  destinatario text not null,
  assunto text not null,
  tipo text not null,
  tentativas int not null default 0,
  situacao situacao_email not null default 'pendente',
  ultimo_erro text,
  created_at timestamptz not null default now(),
  enviado_em timestamptz
);

-- ---------- CONVERSAS ----------
create table grupos_conversa (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  arquivado boolean not null default false,
  created_at timestamptz not null default now()
);
create table grupo_membros (
  grupo_id uuid references grupos_conversa(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  primary key (grupo_id, usuario_id)
);
create table mensagens (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos_conversa(id) on delete cascade,
  autor_id uuid not null references usuarios(id),
  conteudo text not null,
  responde_a uuid references mensagens(id),
  editada boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create table mensagem_mencoes (
  mensagem_id uuid references mensagens(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  primary key (mensagem_id, usuario_id)
);
create table mensagem_leituras (
  mensagem_id uuid references mensagens(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  lida_em timestamptz not null default now(),
  primary key (mensagem_id, usuario_id)
);

-- ---------- AUDITORIA ----------
create table auditoria (
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  entidade_id uuid,
  acao text not null,
  autor_id uuid references usuarios(id),
  valor_anterior jsonb,
  valor_novo jsonb,
  justificativa text,
  contexto text,
  created_at timestamptz not null default now()
);

create index idx_subdemandas_demanda on subdemandas(demanda_id);
create index idx_versoes_subdemanda on versoes(subdemanda_id);
create index idx_aprovacoes_versao on aprovacoes(versao_id);
create index idx_notif_dest on notificacoes(destinatario_id, lida);
create index idx_mensagens_grupo on mensagens(grupo_id, created_at);
create index idx_solic_secretaria on solicitacoes(secretaria_id);


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0002_functions_triggers.sql <<<<<<<<<<<<<<<<<<<<
-- =====================================================================
-- 0002_functions_triggers.sql — Regras de negócio no banco (defesa em profundidade)
-- =====================================================================

-- Helpers de identidade/permissão (SECURITY DEFINER para uso em RLS)
create or replace function app_uid() returns uuid
  language sql stable as $$ select auth.uid() $$;

create or replace function has_cargo(p_chave text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuario_cargos uc join cargos c on c.id = uc.cargo_id
    where uc.usuario_id = auth.uid() and c.chave = p_chave
  );
$$;

create or replace function has_perm(p_chave text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuario_cargos uc
      join cargo_permissoes cp on cp.cargo_id = uc.cargo_id
      join permissoes p on p.id = cp.permissao_id
    where uc.usuario_id = auth.uid() and p.chave = p_chave
  );
$$;

create or replace function is_interno() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios u where u.id = auth.uid()
      and u.ambiente_principal = 'interno' and u.situacao = 'ativa'
  );
$$;

create or replace function minha_secretaria() returns uuid
  language sql stable security definer set search_path = public as $$
  select secretaria_id from usuarios where id = auth.uid();
$$;

create or replace function minha_grafica() returns uuid
  language sql stable security definer set search_path = public as $$
  select grafica_id from usuarios where id = auth.uid();
$$;

-- updated_at automático
create or replace function tg_touch_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger touch_subdemandas before update on subdemandas
  for each row execute function tg_touch_updated_at();

-- Regra: prazo desejado de solicitação externa >= agora + 24h
create or replace function tg_valida_24h() returns trigger
  language plpgsql as $$
  begin
    if new.prazo_desejado is not null and new.prazo_desejado < now() + interval '24 hours' then
      raise exception 'PRAZO_MINIMO_24H: o prazo desejado deve ter no mínimo 24 horas de antecedência.';
    end if;
    return new;
  end; $$;
create trigger valida_24h before insert or update on solicitacoes
  for each row execute function tg_valida_24h();

-- Regra: nova versão invalida aprovações/liberações ativas e confirmações da gráfica
create or replace function tg_nova_versao_invalida() returns trigger
  language plpgsql as $$
  begin
    -- invalida aprovações e liberações de versões anteriores da mesma subdemanda
    update aprovacoes a set ativa = false
      from versoes v where v.id = a.versao_id
      and v.subdemanda_id = new.subdemanda_id and a.ativa = true;
    update liberacoes l set ativa = false
      from versoes v where v.id = l.versao_id
      and v.subdemanda_id = new.subdemanda_id and l.ativa = true;
    update confirmacoes_grafica cg set ativa = false
      from versoes v where v.id = cg.versao_id
      and v.subdemanda_id = new.subdemanda_id and cg.ativa = true;
    -- marca versões anteriores vigentes como substituídas
    update versoes set vigente = false, estado = 'substituida'
      where subdemanda_id = new.subdemanda_id and id <> new.id and vigente = true;
    new.vigente = true;
    return new;
  end; $$;
create trigger nova_versao_invalida before insert on versoes
  for each row execute function tg_nova_versao_invalida();

-- Habilitação de "liberar impressão": exige aprovação ativa de diretor E coordenador na MESMA versão
create or replace function pode_liberar_impressao(p_versao uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from aprovacoes where versao_id = p_versao and cargo_chave='coordenador'
                 and decisao in ('aprovar','aprovar_com_observacao') and ativa)
     and exists (select 1 from aprovacoes where versao_id = p_versao and cargo_chave='diretor'
                 and decisao in ('aprovar','aprovar_com_observacao') and ativa);
$$;

-- Auditoria genérica (chamada pelos serviços da aplicação; trigger de exemplo para versões)
create or replace function registrar_auditoria(
  p_entidade text, p_id uuid, p_acao text, p_ant jsonb, p_novo jsonb, p_justif text
) returns void language sql security definer set search_path = public as $$
  insert into auditoria(entidade, entidade_id, acao, autor_id, valor_anterior, valor_novo, justificativa)
  values (p_entidade, p_id, p_acao, auth.uid(), p_ant, p_novo, p_justif);
$$;


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0003_rls.sql <<<<<<<<<<<<<<<<<<<<
-- =====================================================================
-- 0003_rls.sql — Row Level Security por ambiente (v2.2)
-- Princípio: o servidor/banco é a última linha de defesa; o frontend não protege sozinho.
-- =====================================================================

-- Habilita RLS nas tabelas sensíveis
alter table usuarios enable row level security;
alter table solicitacoes enable row level security;
alter table solicitacao_mensagens enable row level security;
alter table demandas enable row level security;
alter table subdemandas enable row level security;
alter table versoes enable row level security;
alter table links_drive enable row level security;
alter table aprovacoes enable row level security;
alter table liberacoes enable row level security;
alter table pedidos_impressao enable row level security;
alter table confirmacoes_grafica enable row level security;
alter table pedido_mensagens enable row level security;
alter table comentarios enable row level security;
alter table eventos_calendario enable row level security;
alter table notificacoes enable row level security;
alter table grupos_conversa enable row level security;
alter table mensagens enable row level security;

-- ---------- USUÁRIOS ----------
create policy usuarios_self_read on usuarios for select
  using (id = auth.uid() or is_interno());

-- ---------- SOLICITAÇÕES ----------
-- Solicitante: vê as da sua secretaria principal; restritas só se criador/autorizado.
-- Interno: vê todas (para triagem). Diretor/Coordenador veem restritas.
create policy solic_select on solicitacoes for select using (
  is_interno()
  or (
    secretaria_id = minha_secretaria()
    and (restrita = false or criado_por = auth.uid()
         or exists (select 1 from solicitacao_autorizados sa
                    where sa.solicitacao_id = solicitacoes.id and sa.usuario_id = auth.uid()))
  )
);
create policy solic_insert on solicitacoes for insert with check (
  criado_por = auth.uid() and secretaria_id = minha_secretaria()
);
create policy solic_update_interno on solicitacoes for update using (is_interno());

create policy solic_msg_select on solicitacao_mensagens for select using (
  is_interno() or exists (
    select 1 from solicitacoes s where s.id = solicitacao_mensagens.solicitacao_id
      and s.secretaria_id = minha_secretaria()
  )
);
create policy solic_msg_insert on solicitacao_mensagens for insert with check (autor_id = auth.uid());

-- ---------- INTERNO (demandas, versões, aprovações, comentários, calendário) ----------
-- Apenas usuários internos. Solicitante e gráfica NÃO acessam.
create policy dem_interno_all on demandas for all using (is_interno()) with check (is_interno());
create policy sub_interno_all on subdemandas for all using (is_interno()) with check (is_interno());
create policy ver_interno_read on versoes for select using (is_interno());
create policy ver_interno_write on versoes for insert with check (is_interno());
create policy links_interno_all on links_drive for all using (is_interno()) with check (is_interno());
create policy coment_interno_all on comentarios for all using (is_interno()) with check (is_interno());
create policy cal_interno_all on eventos_calendario for all using (is_interno()) with check (is_interno());

-- Aprovar/reprovar: apenas diretor OU coordenador (permissão crítica). Impresso valida cargo específico na app.
create policy aprov_read on aprovacoes for select using (is_interno());
create policy aprov_insert on aprovacoes for insert with check (
  has_perm('aprovar_digital') or has_perm('aprovar_impresso')
);
create policy liber_read on liberacoes for select using (is_interno());
create policy liber_insert on liberacoes for insert with check (
  has_perm('liberar_publicacao') or has_perm('liberar_impressao')
);

-- ---------- PORTAL DA GRÁFICA ----------
-- A gráfica vê SOMENTE pedidos atribuídos a ela; e a versão liberada correspondente.
create policy pedido_select on pedidos_impressao for select using (
  is_interno() or grafica_id = minha_grafica()
);
create policy pedido_update_grafica on pedidos_impressao for update using (
  grafica_id = minha_grafica() or is_interno()
);
create policy conf_grafica_select on confirmacoes_grafica for select using (
  is_interno() or grafica_id = minha_grafica()
);
create policy conf_grafica_insert on confirmacoes_grafica for insert with check (
  grafica_id = minha_grafica()
);
create policy pedido_msg_select on pedido_mensagens for select using (
  is_interno() or exists (select 1 from pedidos_impressao p
    where p.id = pedido_mensagens.pedido_id and p.grafica_id = minha_grafica())
);
create policy pedido_msg_insert on pedido_mensagens for insert with check (autor_id = auth.uid());

-- Gráfica só enxerga versões liberadas dos SEUS pedidos (não rascunhos/substituídas)
create policy ver_grafica_read on versoes for select using (
  exists (
    select 1 from pedidos_impressao p
    where p.grafica_id = minha_grafica()
      and p.versao_liberada_id = versoes.id
      and versoes.estado = 'liberada_impressao'
  )
);

-- ---------- NOTIFICAÇÕES ----------
create policy notif_own on notificacoes for select using (destinatario_id = auth.uid());
create policy notif_update_own on notificacoes for update using (destinatario_id = auth.uid());

-- ---------- CONVERSAS (só internos e membros do grupo) ----------
create policy grupos_membro on grupos_conversa for select using (
  is_interno() and exists (select 1 from grupo_membros gm
    where gm.grupo_id = grupos_conversa.id and gm.usuario_id = auth.uid())
);
create policy msg_membro_read on mensagens for select using (
  exists (select 1 from grupo_membros gm where gm.grupo_id = mensagens.grupo_id and gm.usuario_id = auth.uid())
);
create policy msg_membro_insert on mensagens for insert with check (
  autor_id = auth.uid()
  and exists (select 1 from grupo_membros gm where gm.grupo_id = mensagens.grupo_id and gm.usuario_id = auth.uid())
);
create policy msg_edit_own on mensagens for update using (autor_id = auth.uid() or has_perm('moderar_conversa'));


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0004_drive_e_impressao.sql <<<<<<<<<<<<<<<<<<<<
-- =====================================================================
-- 0004_drive_e_impressao.sql
-- (1) Dedupe de links do Drive por IDENTIFICADOR do arquivo (não pela URL textual).
-- (2) Validação completa de "liberar para impressão".
-- =====================================================================

-- ---------- (1) Google Drive: id do arquivo ----------
alter table versoes     add column if not exists drive_file_id text;
alter table links_drive add column if not exists drive_file_id text;

-- Extrai o ID do arquivo a partir dos formatos comuns de link do Drive/Docs.
create or replace function drive_file_id(p_url text) returns text
  language plpgsql immutable as $$
  declare m text;
  begin
    if p_url is null then return null; end if;
    if p_url !~* '(drive|docs)\.google\.com' then return null; end if;
    m := substring(p_url from '/(?:file|document|spreadsheets|presentation)/d/([A-Za-z0-9_-]{10,})');
    if m is not null then return m; end if;
    m := substring(p_url from '/drive/folders/([A-Za-z0-9_-]{10,})');
    if m is not null then return m; end if;
    m := substring(p_url from '[?&]id=([A-Za-z0-9_-]{10,})');
    return m; -- pode ser null quando o link não identifica um arquivo
  end; $$;

-- Preenche drive_file_id automaticamente a partir do link.
create or replace function tg_set_drive_id_versao() returns trigger language plpgsql as $$
  begin new.drive_file_id := drive_file_id(new.link_drive); return new; end; $$;
drop trigger if exists set_drive_id_versao on versoes;
create trigger set_drive_id_versao before insert or update of link_drive on versoes
  for each row execute function tg_set_drive_id_versao();

create or replace function tg_set_drive_id_link() returns trigger language plpgsql as $$
  begin new.drive_file_id := drive_file_id(new.url); return new; end; $$;
drop trigger if exists set_drive_id_link on links_drive;
create trigger set_drive_id_link before insert or update of url on links_drive
  for each row execute function tg_set_drive_id_link();

-- Proteção adicional do banco: o MESMO arquivo não pode ser duas versões ativas
-- da mesma subdemanda (a app já avisa antes, com mensagem amigável).
create unique index if not exists versoes_fileid_unico_ativo
  on versoes(subdemanda_id, drive_file_id)
  where drive_file_id is not null and estado not in ('substituida','cancelada');

-- ---------- (2) Liberar para impressão: validação completa ----------
-- Retorna a lista de pendências (vazia = pode liberar). A app exibe as mensagens.
create or replace function validar_liberacao_impressao(p_versao uuid)
  returns text[] language plpgsql stable security definer set search_path = public as $$
  declare
    v record; ped record; pend text[] := '{}';
  begin
    select * into v from versoes where id = p_versao;
    if v is null then return array['Versão não encontrada.']; end if;

    -- vigência e estado
    if not v.vigente then pend := pend || 'A versão não é a versão vigente.'; end if;
    if v.estado in ('substituida','cancelada') then pend := pend || 'A versão está substituída ou cancelada.'; end if;

    -- aprovações ativas do Coordenador E do Diretor na MESMA versão
    if not exists (select 1 from aprovacoes where versao_id = p_versao and cargo_chave='coordenador'
                   and decisao in ('aprovar','aprovar_com_observacao') and ativa)
      then pend := pend || 'Falta a aprovação ativa do Coordenador nesta versão.'; end if;
    if not exists (select 1 from aprovacoes where versao_id = p_versao and cargo_chave='diretor'
                   and decisao in ('aprovar','aprovar_com_observacao') and ativa)
      then pend := pend || 'Falta a aprovação ativa do Diretor nesta versão.'; end if;

    -- ficha técnica do pedido da mesma subdemanda
    select * into ped from pedidos_impressao where subdemanda_id = v.subdemanda_id
      order by created_at desc limit 1;
    if ped is null then
      pend := pend || 'Não há pedido de impressão para esta subdemanda.';
    else
      if ped.grafica_id is null then pend := pend || 'Selecione a gráfica responsável.'; end if;
      if coalesce(ped.quantidade,'') = '' then pend := pend || 'Informe a quantidade.'; end if;
      if coalesce(ped.medidas,'') = '' and coalesce(ped.formato,'') = '' then pend := pend || 'Informe medidas ou formato.'; end if;
      if coalesce(ped.material,'') = '' then pend := pend || 'Informe o material.'; end if;
      if coalesce(ped.acabamento,'') = '' then pend := pend || 'Informe o acabamento.'; end if;
      if ped.prazo is null then pend := pend || 'Informe o prazo.'; end if;
      if coalesce(ped.local_entrega,'') = '' then pend := pend || 'Informe o local de entrega.'; end if;
    end if;

    -- nenhuma outra liberação de impressão ativa em versão diferente da mesma subdemanda
    if exists (
      select 1 from liberacoes l join versoes vv on vv.id = l.versao_id
      where l.tipo='impressao' and l.ativa and vv.subdemanda_id = v.subdemanda_id and vv.id <> p_versao
    ) then pend := pend || 'Já existe uma liberação de impressão ativa em outra versão desta subdemanda.'; end if;

    return pend;
  end; $$;

-- Boolean derivado (usado por guardas/telas). Continua MANUAL: quem libera é Diretor ou Coordenador.
create or replace function pode_liberar_impressao(p_versao uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(array_length(validar_liberacao_impressao(p_versao),1),0) = 0;
$$;


-- >>>>>>>>>>>>>>>>>>>> supabase/seed.sql <<<<<<<<<<<<<<<<<<<<
-- =====================================================================
-- seed.sql — Dados de referência + matriz de permissões (v2.2)
-- Usuários de demonstração são criados via scripts/seed-demo-users.ts
-- (precisam existir em auth.users antes de usuarios).
-- =====================================================================

-- Cargos iniciais
insert into cargos(chave,nome,inicial) values
 ('administrador','Administrador do Sistema',true),
 ('diretor','Diretor de Comunicação',true),
 ('coordenador','Coordenador de Comunicação',true),
 ('designer','Designer',true),
 ('videomaker','Videomaker',true),
 ('social_media','Social Media',true),
 ('jornalista','Jornalista ou Redator',true),
 ('solicitante','Solicitante',true),
 ('grafica','Gráfica',true),
 ('visualizador','Visualizador Interno',true)
on conflict (chave) do nothing;

-- Permissões (críticas marcadas)
insert into permissoes(chave,descricao,critica) values
 ('aprovar_digital','Aprovar material digital/audiovisual',true),
 ('aprovar_impresso','Aprovar material impresso (dupla aprovação)',true),
 ('liberar_publicacao','Liberar para publicação',true),
 ('liberar_impressao','Liberar para impressão',true),
 ('reprovar','Solicitar correção / reprovar',true),
 ('autorizar_reimpressao','Autorizar reimpressão',true),
 ('reabrir_demanda','Reabrir demanda finalizada',true),
 ('prioridade_emergencial','Definir prioridade emergencial',true),
 ('restringir_solicitacao','Marcar/retirar restrição de solicitação',true),
 ('excluir_logico','Excluir logicamente / restaurar',true),
 ('alterar_permissoes','Alterar permissões críticas',true),
 ('administrar_usuarios','Administrar cargos e usuários',true),
 ('triagem','Triagem de solicitações',false),
 ('criar_demanda','Criar/editar demanda e subdemanda',false),
 ('editar_admin_demanda','Editar campos administrativos da demanda',false),
 ('movimentar_producao','Movimentar subdemanda (produção)',false),
 ('editar_operacional','Editar campos operacionais/links/versões',false),
 ('confirmar_pedido_grafica','Confirmar/atualizar pedido (gráfica)',false),
 ('moderar_conversa','Moderar/administrar grupos de conversa',false),
 ('registrar_publicacao','Registrar publicação',false)
on conflict (chave) do nothing;

-- Matriz cargo x permissão (resumo v2.2)
-- Diretor
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='diretor' and p.chave in
   ('aprovar_digital','aprovar_impresso','liberar_publicacao','liberar_impressao','reprovar',
    'autorizar_reimpressao','reabrir_demanda','prioridade_emergencial','restringir_solicitacao',
    'excluir_logico','alterar_permissoes','administrar_usuarios','triagem','criar_demanda',
    'editar_admin_demanda','movimentar_producao','editar_operacional','registrar_publicacao','moderar_conversa')
on conflict do nothing;
-- Coordenador (sem alterar_permissoes/administrar_usuarios)
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='coordenador' and p.chave in
   ('aprovar_digital','aprovar_impresso','liberar_publicacao','liberar_impressao','reprovar',
    'autorizar_reimpressao','reabrir_demanda','prioridade_emergencial','restringir_solicitacao',
    'excluir_logico','triagem','criar_demanda','editar_admin_demanda','movimentar_producao',
    'editar_operacional','registrar_publicacao','moderar_conversa')
on conflict do nothing;
-- Administrador (governança de contas/permissões, sem aprovações de negócio)
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='administrador' and p.chave in
   ('alterar_permissoes','administrar_usuarios','excluir_logico')
on conflict do nothing;
-- Membros de produção (designer, videomaker, social_media, jornalista)
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave in ('designer','videomaker','social_media','jornalista')
    and p.chave in ('criar_demanda','movimentar_producao','editar_operacional')
on conflict do nothing;
-- Social media também registra publicação
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='social_media' and p.chave='registrar_publicacao'
on conflict do nothing;
-- Gráfica
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='grafica' and p.chave='confirmar_pedido_grafica'
on conflict do nothing;

-- Secretarias principais + unidades
insert into secretarias(nome) values
 ('Saúde'),('Educação'),('Agricultura'),('Infraestrutura'),
 ('Assistência Social'),('Cultura'),('Esportes'),('Gabinete')
on conflict do nothing;
insert into unidades(secretaria_id,nome)
  select id,'Vigilância Epidemiológica' from secretarias where nome='Saúde'
  union all select id,'Vigilância Sanitária' from secretarias where nome='Saúde'
  union all select id,'Atenção Básica' from secretarias where nome='Saúde'
  union all select id,'Hospital Municipal' from secretarias where nome='Saúde'
  union all select id,'Ensino Fundamental' from secretarias where nome='Educação'
  union all select id,'Agricultura Familiar' from secretarias where nome='Agricultura';

-- Gráficas
insert into graficas(nome,contato_email) values
 ('Gráfica Boa Impressão','contato@boaimpressao.com.br'),
 ('Gráfica Central Maracás','central@graficamaracas.com.br')
on conflict do nothing;

-- Grupos operacionais / de conversa iniciais
insert into grupos_operacionais(nome) values
 ('Geral'),('Coordenação'),('Criação'),('Audiovisual'),
 ('Social Media e Publicações'),('Jornalismo e Coberturas'),('Impressos');
insert into grupos_conversa(nome,descricao)
  select nome, 'Grupo interno de conversa' from grupos_operacionais;


-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0005_briefing_e_avatar.sql <<<<<<<<<<<<<<<<<<<<
-- =====================================================================
-- 0005_briefing_e_avatar.sql
-- Briefing duplo (original do solicitante x interno consolidado) + avatar do usuário.
-- Idempotente: pode rodar mais de uma vez com segurança.
-- =====================================================================
alter table solicitacoes add column if not exists briefing_interno text;      -- consolidado pela Coordenação
alter table demandas     add column if not exists briefing_consolidado text;  -- copiado ao aprovar
alter table demandas     add column if not exists secretaria_id uuid references secretarias(id);
alter table demandas     add column if not exists unidade_id uuid references unidades(id);
alter table usuarios     add column if not exists avatar_url text;            -- foto opcional (URL); senão, iniciais

-- >>>>>>>>>>>>>>>>>>>> supabase/migrations/0006_tarefa_dinamica.sql <<<<<<<<<<<<<<<<<<<<
-- =====================================================================
-- 0006_tarefa_dinamica.sql — Página central da demanda (tarefa dinâmica).
-- Idempotente.
-- =====================================================================
-- Conteúdo operacional por tipo (jsonb flexível) + resumo/observações
alter table subdemandas add column if not exists resumo text;
alter table subdemandas add column if not exists observacoes text;
alter table subdemandas add column if not exists conteudo jsonb not null default '{}'::jsonb;

-- Links/referências: exclusão lógica
alter table links_drive add column if not exists deleted_at timestamptz;
alter table links_drive add column if not exists updated_at timestamptz;

-- Checklist: responsável do item, soft delete, autoria/ordem já existem
alter table checklists add column if not exists responsavel_id uuid references usuarios(id);
alter table checklists add column if not exists deleted_at timestamptz;
alter table checklists add column if not exists created_by uuid references usuarios(id);

-- Comentários: edição + resposta + menções
alter table comentarios add column if not exists editada boolean not null default false;
alter table comentarios add column if not exists responde_a uuid references comentarios(id);
create table if not exists comentario_mencoes (
  comentario_id uuid references comentarios(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  primary key (comentario_id, usuario_id)
);

