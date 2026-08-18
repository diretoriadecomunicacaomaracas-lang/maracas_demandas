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
