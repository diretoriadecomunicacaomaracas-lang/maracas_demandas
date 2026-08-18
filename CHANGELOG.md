# CHANGELOG

## [0.1.0] — Fase 0 + Fase 1 (fundação)
### Adicionado
- Estrutura do projeto Next.js/TS/Tailwind com tokens do Design System aprovado.
- Banco: `0001_schema`, `0002_functions_triggers`, `0003_rls`, `seed.sql`.
- Regras no banco: 24h, invalidação por nova versão, liberação de impressão (2 aprovações), link único por versão, soft delete.
- Permissões em TypeScript (`src/lib/permissions.ts`) + testes (Vitest) — todas as asserções verdes.
- Autenticação: login, callback de convite/recuperação, middleware de ambientes (sem seletor público).
- UI base fiel ao protótipo: Button, StatusChip/AtrasoChip, Sidebar (drawer mobile acessível), AppShell, Painel com leitura real.
- E-mail desacoplado (Resend/SMTP) com registro auditável.
- Documentação completa (README, ARQUITETURA, BANCO_DE_DADOS, PERMISSOES_E_RLS, CONFIGURACAO_EMAIL, IMPLANTACAO, TESTES, PENDENCIAS, ALTERACOES_VISUAIS, IMPEDIMENTOS, MANUAL_BASICO).
### Preservado
- Protótipo aprovado intocado em `referencias/prototipo-aprovado/`.
### Observações
- Fases 2–7 pendentes; execução/homologação depende de credenciais externas.

## [0.1.1] — Ajustes obrigatórios (Etapa 3)
### Adicionado
- Migration `0004_drive_e_impressao.sql`: `drive_file_id()`, colunas + triggers, índice único por ID de arquivo, `validar_liberacao_impressao()` e `pode_liberar_impressao()` reforçada.
- `src/lib/drive.ts` (normalização por ID, URL canônica, mensagens amigáveis) + `src/lib/impressao.ts` (checklist) + `src/server/versoes.ts` (dedupe amigável antes do índice).
- Testes: `drive.test.ts`, `impressao.test.ts` (executados, OK).
### Confirmado (decisões aprovadas)
- Reabertura só Diretor/Coordenador (Admin sem a permissão); liberação de impressão única e manual; somente links/metadados (sem Storage); homologação real só após credenciais.

## [0.2.0] — Fases 2–7 (camada funcional local)
### Adicionado
- `src/domain/*`: store em memória, fluxos/transições, regras, seed fictício e serviços de todas as áreas (solicitações/triagem, demandas/subdemandas, Kanban validado, versões com dedupe de Drive, aprovações digital e impressa, Portal da Gráfica, calendário, notificações internas + fila de e-mail, conversas, auditoria, reabertura/arquivamento/exclusão lógica).
- Fonte de dados por env (`DATA_SOURCE=memory|supabase`) e exemplo de Server Action.
- Testes executáveis em Node (`npm run test:local`): 55 asserções, 0 falhas.
### Observações
- UI Next.js consome os serviços; execução no navegador e integração Supabase/e-mail/Vercel dependem de `npm install` e das credenciais externas.

## [0.2.2] — Compatibilidade de testes locais
### Corrigido
- `npm run test:local` agora usa `tsx` (incluído em devDependencies) em vez de `node --experimental-strip-types`, funcionando em Node 18/20/22. Guia e TESTES.md atualizados.

## [0.3.0] — Wiring da interface à Supabase (fluxos principais)
### Adicionado
- Backbone `src/server/data/*` + `src/server/context.ts` (dados reais reusando as regras verificadas).
- Páginas conectadas: Painel (indicadores reais), Central de Solicitações + triagem, Demandas Tabela/Kanban (drag com validação no servidor e reversão), Detalhe da demanda (versões/aprovações/impressão/histórico), Criação/Audiovisual/Impressos, Portal do Solicitante (nova em etapas + detalhe + mensagens), Portal da Gráfica (detalhe + confirmar/produção), Notificações, Calendário/Conversas/Arquivadas/Administração (guardadas).
- Guard de rota por permissão (`GuardInterno`) — bloqueia acesso indevido, inclusive por URL.
- e2e Playwright: login por perfil, navegação, nova solicitação, triagem, Kanban, bloqueios.
### Observações
- Não verificável no navegador neste ambiente (registro npm bloqueado); requer `npm install` + Supabase para rodar. Domínio segue com 55 asserções, 0 falhas.

## [0.3.1] — Ajustes pós 1º teste
### Corrigido
- **Kanban**: causa raiz (coluna=macroetapa → etapa pulando passos) resolvida; colunas por etapa (camada 2) por tipo + tabela de transições explícita + destinos pré-checados + mensagem com origem/destinos; reversão só em falha real. Teste `kanban.test.ts` (10/10).
### Adicionado
- **Setor/unidade** obrigatório na nova solicitação (só da secretaria do usuário; setor padrão do perfil), cadastro admin de setores, exibição no detalhe.
- **Central** com abas (Pendentes/Em análise/Aguardando/Processadas/Todas), fila cronológica, colunas completas (secretaria, setor, solicitante, chegada, prazo, status, tempo aguardando), decisão preservada e link para a demanda gerada.
- e2e de setor e Central. `test:local` agora com 65 asserções.
### SQL
- Nenhuma migration nova necessária (usa colunas já existentes).

## [0.4.0] — Briefing duplo + responsáveis visíveis
### Banco (requer PATCH_0005.sql no Supabase)
- +solicitacoes.briefing_interno, +demandas.briefing_consolidado, +demandas.secretaria_id/unidade_id, +usuarios.avatar_url.
### Adicionado
- Briefing original (read-only) x interno consolidado (editável, auditado); tela de triagem com abas e validação na aprovação; cópia do consolidado para a demanda; vínculo preservado.
- Responsáveis visíveis: coluna na Tabela, avatares no Kanban, seção “Responsáveis e equipe” no detalhe (atribuir/substituir/adicionar/remover, só Diretor/Coordenador); avatar por URL/iniciais.
- Testes: `triagem.test.ts` (8). `test:local` agora 73 asserções, 0 falhas.

## [0.5.0] — Menu de usuário, notificações, portal, responsáveis e prioridade
### Adicionado
- UserMenu (perfil + Sair → /login) na barra interna e nos portais (novo PortalHeader).
- Notificações funcionais: NotifBell (contador + dropdown + polling 30s) e geração por evento aos envolvidos (server/notify via service role); solicitante e gráfica também recebem.
- Portal do Solicitante com sub-abas Enviadas/Aprovadas(em execução)/Finalizadas; ação Finalizar demanda que conclui a solicitação.
- Responsável exibido só com avatares (sem nome, tooltip) na tabela e no Kanban.
- Prioridade: coluna na tabela (PriorityChip) e indicador compacto no Kanban (PriorityDot).
### SQL
- Nenhum novo (usa colunas/tabelas existentes; PATCH_0005 continua sendo o único SQL da fase de wiring).

## [0.6.0] — Página central da demanda + navegação (requer PATCH_0006.sql)
### Banco
- subdemandas.resumo/observacoes/conteudo(jsonb); links_drive.deleted_at/updated_at; checklists.responsavel_id/deleted_at/created_by; comentarios.editada/responde_a; comentario_mencoes.
### Adicionado
- BackButton + Breadcrumb (voltar seguro, nunca ao login) nas páginas secundárias.
- Demandas clicáveis em Tabela (linha) e Kanban (clique x arraste por limiar) + calendário/notificações → /app/demandas/[id].
- Página central da tarefa: cabeçalho completo + abas (Visão geral, Briefing, Roteiro e conteúdo por tipo, Datas, Responsáveis, Links e referências, Versões/Aprovações, Checklist, Comentários, Histórico) com edição por seção, permissões, salvar/cancelar, aviso de não salvo, auditoria e notificações.
- Serviços: editarGerencial/editarOperacional, links/checklist/comentarios; domain/conteudo (campos por tipo). Teste conteudo (8). test:local = 81 asserções, 0 falhas.
