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
