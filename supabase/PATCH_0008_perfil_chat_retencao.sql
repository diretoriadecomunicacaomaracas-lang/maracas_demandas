-- =====================================================================
-- PATCH_0008_perfil_chat_retencao.sql
-- Rodada de finalização — avatar (Storage), chat (insert policy) e
-- retenção de 30 dias da Lixeira. Aditivo, idempotente, sem DROP destrutivo.
--
-- NÃO EXECUTAR sem autorização. Rodar no SQL Editor do Supabase (owner).
-- Ordem: aplicar DEPOIS do PATCH_0007 (se ainda não aplicado, ver ordem no chat).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) STORAGE — bucket de AVATARES (imagens de perfil).
--    Bucket público (avatar é de baixa sensibilidade e exibido na UI).
--    Escrita restrita à própria pasta do usuário (<uid>/arquivo).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

drop policy if exists avatares_leitura on storage.objects;
create policy avatares_leitura on storage.objects for select
  using (bucket_id = 'avatares');

drop policy if exists avatares_escrita on storage.objects;
create policy avatares_escrita on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatares_update on storage.objects;
create policy avatares_update on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatares_delete on storage.objects;
create policy avatares_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 2) BATE-PAPO — permitir INSERT de mensagem por MEMBRO do grupo.
--    (Hoje o app grava via service_role no servidor; esta policy permite
--     migrar o envio para o cliente do usuário no futuro, com segurança.)
-- ---------------------------------------------------------------------
drop policy if exists msg_insert_membro on public.mensagens;
create policy msg_insert_membro on public.mensagens for insert to authenticated with check (
  autor_id = auth.uid()
  and exists (select 1 from public.grupo_membros gm where gm.grupo_id = mensagens.grupo_id and gm.usuario_id = auth.uid())
);
-- Índice auxiliar para "não lidas".
create index if not exists idx_msg_leituras_user on public.mensagem_leituras (usuario_id);

-- ---------------------------------------------------------------------
-- 3) RETENÇÃO DA LIXEIRA — purga de subdemandas excluídas há 30+ dias.
--    Exclusão lógica marca deleted_at; arquivamento NÃO conta.
--    Preserva auth.users. Rodar por agendamento (pg_cron ou Scheduled Function).
-- ---------------------------------------------------------------------
create or replace function public.purgar_lixeira_expirada()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  with alvo as (
    select id from public.subdemandas
    where situacao = 'excluida_logicamente'
      and deleted_at is not null
      and deleted_at < now() - interval '30 days'
  )
  , reg as (
    insert into public.auditoria (entidade, entidade_id, acao, autor_id, contexto)
    select 'subdemanda', id, 'purgada_definitivamente', null, 'retencao_30d' from alvo
    returning 1
  )
  delete from public.subdemandas s using alvo a where s.id = a.id;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.purgar_lixeira_expirada() from public, anon;
-- Conceder execução apenas ao papel de serviço (agendador). Ajuste se necessário.
-- grant execute on function public.purgar_lixeira_expirada() to service_role;

-- AGENDAMENTO (escolha UMA opção no ambiente):
--   (a) pg_cron (se habilitado):
--       select cron.schedule('purga-lixeira', '0 3 * * *', $$select public.purgar_lixeira_expirada();$$);
--   (b) Supabase Scheduled Edge Function chamando a RPC diariamente.
-- =====================================================================
-- FIM DO PATCH_0008
-- =====================================================================
