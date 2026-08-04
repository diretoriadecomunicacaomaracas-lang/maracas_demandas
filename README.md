# Gestão de Demandas — Comunicação · Prefeitura de Maracás/BA (MVP)

Aplicação web para organizar o fluxo de demandas da equipe de Comunicação: solicitações das secretarias, planejamento, produção, aprovações, impressos, calendário, conversas internas, notificações, histórico e auditoria. Regras oficiais: **Especificação v2.2**. Aparência: **protótipo aprovado** (Etapa 2), preservado em `referencias/prototipo-aprovado/`.

> **Estado atual (Fase 0 + Fase 1 — fundação).** Este repositório entrega o planejamento completo e a fundação funcional: configuração do projeto, **banco de dados (schema + RLS + seed)**, matriz de **permissões** com testes, **autenticação** (login/convite/recuperação) e o **shell de UI** fiel ao protótipo. As Fases 2–6 (solicitações, demandas/Kanban, aprovações/impressos, calendário/notificações, conversas) constroem-se sobre esta base — ver `docs/RELATORIO_AUDITORIA.md`, `ARQUITETURA.md` e `PENDENCIAS_IMPLEMENTACAO.md`.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind (tokens do Design System) · Supabase (PostgreSQL + Auth + RLS + Realtime) · Resend/SMTP (e-mail desacoplado) · Vitest + Playwright.

## Começar (local)
1. `cp .env.example .env.local` e preencha as variáveis (ver `IMPLANTACAO.md`).
2. `npm install`
3. Banco: com Supabase CLI, `supabase start` e aplique as migrations de `supabase/migrations` + `supabase/seed.sql` (`supabase db reset`).
4. Usuários de homologação: `npx tsx scripts/seed-demo-users.ts` (precisa de `SUPABASE_SERVICE_ROLE_KEY`).
5. `npm run dev` → http://localhost:3000
6. Testes: `npm test` (unit) · `npm run e2e` (Playwright).

## Estrutura
- `src/app` — rotas (login, ambiente interno `/app/*`, portais).
- `src/components` — UI (fiel ao protótipo) e layout (Sidebar drawer, AppShell).
- `src/lib` — clientes Supabase, permissões, datas (fuso Brasília), status.
- `src/server` — guardas de permissão, e-mail.
- `supabase/migrations` — schema, funções/triggers, RLS. `supabase/seed.sql` — referência + matriz.
- `referencias/prototipo-aprovado` — protótipo original **intocado**.

## Documentação
`ARQUITETURA.md` · `BANCO_DE_DADOS.md` · `PERMISSOES_E_RLS.md` · `CONFIGURACAO_EMAIL.md` · `IMPLANTACAO.md` · `TESTES.md` · `PENDENCIAS_IMPLEMENTACAO.md` · `ALTERACOES_VISUAIS_IMPLEMENTACAO.md` · `IMPEDIMENTOS_E_DECISOES.md` · `CHANGELOG.md` · `MANUAL_BASICO.md` · `docs/*`.

## Princípios inegociáveis
Sem módulo financeiro · sem storage próprio de arquivos pesados (só links do Drive) · sem publicação automática · sem conversas privadas · **permissões validadas no servidor + RLS** · soft delete · fuso America/Sao_Paulo.
