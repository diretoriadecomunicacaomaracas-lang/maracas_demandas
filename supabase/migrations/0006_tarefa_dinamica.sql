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
