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
