# BANCO DE DADOS

Modelo relacional (PostgreSQL/Supabase) implementando o modelo conceitual da v2.2. Migrations versionadas em `supabase/migrations/`. **Não** alterar o banco manualmente sem migration correspondente.

## Migrations
- `0001_schema.sql` — tabelas, enums, índices (inclui índice único parcial de link por versão).
- `0002_functions_triggers.sql` — helpers de RLS, updated_at, regra de 24h, invalidação por nova versão, `pode_liberar_impressao`, auditoria.
- `0003_rls.sql` — políticas Row Level Security por ambiente.
- `seed.sql` — cargos, permissões, matriz cargo×permissão, secretarias/unidades, gráficas, grupos.

## Principais entidades (resumo)
- **Institucional:** `usuarios` (1:1 auth.users), `cargos`, `permissoes`, `cargo_permissoes`, `usuario_cargos`, `secretarias`, `unidades` (subordinadas à secretaria principal), `graficas`, `grupos_operacionais`, `convites`.
- **Solicitações:** `solicitacoes` (protocolo, restrita, prazo_desejado, status_externo), `solicitacao_mensagens`, `solicitacao_autorizados`.
- **Demandas:** `demandas` (campanha, situação), `subdemandas` (tipo, etapa, macroetapa, prazo, prioridade), `subdemanda_membros`, `checklists`, `comentarios`.
- **Links/versões:** `versoes` (numero, link_drive único por versão ativa, estado, vigente), `links_drive`.
- **Aprovações:** `aprovacoes` (cargo, decisão, ativa), `liberacoes` (publicação/impressão, ativa).
- **Impressos:** `pedidos_impressao` (ficha técnica, versao_liberada), `confirmacoes_grafica` (ativa), `pedido_mensagens`.
- **Calendário:** `eventos_calendario` (inicio em UTC; exibição em America/Sao_Paulo).
- **Notificações:** `notificacoes` (interno/email), `emails_enviados` (tentativas/situação).
- **Conversas:** `grupos_conversa`, `grupo_membros`, `mensagens`, `mensagem_mencoes`, `mensagem_leituras`.
- **Auditoria:** `auditoria` (entidade, ação, autor, valor_anterior/novo, justificativa).

## Regras no banco (defesa em profundidade)
- **24h:** trigger `valida_24h` bloqueia `prazo_desejado < now()+24h`.
- **Invalidação:** trigger `nova_versao_invalida` desativa aprovações/liberações/confirmações e marca versões anteriores como `substituida` ao inserir nova versão.
- **Link único por versão:** índice `versoes_link_unico_ativo` impede reuso de link em versões ativas (a app alerta antes).
- **Liberar impressão:** `pode_liberar_impressao(versao)` exige aprovação ativa de `coordenador` **e** `diretor` na mesma versão.
- **Soft delete:** colunas `deleted_at`; nada é apagado fisicamente.

## Datas e fuso
Todos os `timestamptz` guardam UTC. A exibição (DD/MM/AAAA, 24h) usa `America/Sao_Paulo` via `src/lib/dates.ts`. Ex.: evento 26/08/2026 14h é gravado em UTC e reexibido como 26/08/2026 14:00 em Brasília.

## Plano de migrations (próximas fases)
- `0004_triagem.sql` — colunas/estado de triagem e conversão em demanda.
- `0005_kanban_transicoes.sql` — tabela de transições válidas por tipo de fluxo (validação de arrastar).
- `0006_notificacoes.sql` — gatilhos de notificação e view do resumo diário de atrasos.
- `0007_realtime.sql` — publication para conversas/notificações (Supabase Realtime).

## Atualização 0004 — Drive por ID e liberação de impressão
- **`drive_file_id(url)`** extrai o identificador do arquivo (file/document/spreadsheets/presentation/folders e `?id=`). Colunas `drive_file_id` em `versoes` e `links_drive` preenchidas por trigger.
- **Índice** `versoes_fileid_unico_ativo (subdemanda_id, drive_file_id)` para versões ativas: o **mesmo arquivo** não pode ser duas versões diferentes (proteção final; a app avisa antes).
- **`validar_liberacao_impressao(versao)`** retorna a lista de pendências (vazia = liberável): versão vigente; não substituída/cancelada; aprovação ativa do Coordenador **e** do Diretor na mesma versão; gráfica selecionada; quantidade; medidas ou formato; material; acabamento; prazo; local de entrega; e ausência de outra liberação de impressão ativa em versão diferente da subdemanda. **`pode_liberar_impressao(versao)`** = lista vazia. A liberação continua **manual** (Diretor ou Coordenador).
