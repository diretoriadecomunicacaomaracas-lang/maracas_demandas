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
