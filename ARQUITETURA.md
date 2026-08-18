# ARQUITETURA

## 1. Visão geral
Aplicação **Next.js (App Router)** renderizando Server Components para leitura protegida por RLS e Client Components para interações. **Supabase** provê PostgreSQL, Auth e Realtime. A segurança é em profundidade: **RLS no banco** (fonte final) + **guardas no servidor** (`src/server/guard.ts`) + UI condicional. E-mail em **camada desacoplada** (Resend ou SMTP). Hospedagem alvo: **Vercel** (app) + **Supabase** (dados/auth).

## 2. Justificativa da stack
Segue a stack recomendada no pedido (Next.js/TS/Supabase/Vercel/Resend/Playwright). Nenhuma alteração de stack foi feita. Motivos: custo inicial controlado, RLS nativa (essencial para os três ambientes), Realtime para conversas/notificações, e SSR para proteção de dados no servidor.

## 3. Estrutura de pastas
```
src/
  app/            rotas (login, /app/* interno, /portal solicitante, /grafica)
  components/ui   primitivos (Button, StatusChip, ...) fiéis ao Design System
  components/layout Sidebar (drawer mobile), AppShell (topbar+menu)
  lib/            supabase-{server,browser,admin}, permissions, statuses, dates
  server/         guard (permissão no servidor), email (abstração)
  types/          tipos do banco
supabase/
  migrations/     0001_schema, 0002_functions_triggers, 0003_rls
  seed.sql        cargos, permissões, matriz, secretarias, grupos
scripts/          seed-demo-users.ts
tests/ e2e/       vitest + playwright
referencias/      protótipo aprovado (intocado) + docs visuais
```

## 4. Camadas e responsabilidades
- **Interface** (`components`, `app/*/page.tsx`): apresentação fiel ao protótipo; sem regra de negócio embutida.
- **Regras de negócio** (`lib/permissions`, `lib/statuses`, `server/guard`, funções SQL): aprovação, liberação, atraso, 24h, invalidação.
- **Dados** (`supabase/*`): schema + RLS + triggers.
- **Auth** (`middleware.ts`, `app/login`, `app/auth/callback`): sessão, convite, recuperação, roteamento por ambiente.
- **Notificações/e-mail** (`server/email`, tabelas `notificacoes`/`emails_enviados`).

## 5. Fluxo de autenticação e ambientes
Login → Supabase Auth → `middleware.ts` lê `usuarios.ambiente_principal` e redireciona: interno → `/app/painel`, solicitante → `/portal`, gráfica → `/grafica`. **Não há seletor público de ambiente.** RLS restringe os dados de cada ambiente independentemente da rota.

## 6. Fases de implementação (roadmap)
- **Fase 0 (feita):** auditoria, arquitetura, esqueleto, protótipo preservado, plano de migrations, credenciais.
- **Fase 1 (feita — fundação):** app + componentes base + banco (migrations/RLS/seed) + auth + usuários/cargos/permissões + secretarias/gráficas/grupos.
- **Fase 2:** Portal do Solicitante (protocolo, 24h, visibilidade por secretaria, restritas) + Central de Solicitações + triagem.
- **Fase 3:** Demandas/subdemandas, Tabela, Kanban (drag validado no servidor), links/versões, comentários, histórico.
- **Fase 4:** Aprovações (digital) + dupla aprovação + liberação de impressão + Portal da Gráfica + confirmação/produção/entrega.
- **Fase 5:** Calendário (fuso), notificações internas + e-mails + resumo diário de atrasos (cron 8h).
- **Fase 6:** Conversas (grupos, menções, leituras, pesquisa) via Realtime.
- **Fase 7:** Testes, segurança/RLS, responsividade, acessibilidade, performance, seed, homologação.

## 7. Credenciais necessárias (ação humana)
Preencher em `.env.local` (nunca no código):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (projeto Supabase).
- `RESEND_API_KEY` + `EMAIL_FROM` (ou variáveis `SMTP_*`).
- `NEXT_PUBLIC_APP_URL` (URL do sistema), `CRON_SECRET` (resumo de atrasos), conta **Vercel** para deploy.
Ver `IMPLANTACAO.md` e `CONFIGURACAO_EMAIL.md`.

## 8. Camada de domínio e fonte de dados (Fases 2–7)
Toda a regra de negócio vive em `src/domain/` (framework-agnóstica): `types`, `store` (interface + memória), `flows` (transições válidas), `rules` (24h, atraso), `seed` (dados fictícios) e `services/*` (solicitações, demandas, versões, aprovações, gráfica, calendário, conversas, notificações, auditoria). Isso permite **rodar e testar tudo localmente sem credenciais** (modo `DATA_SOURCE=memory`). Quando as credenciais existirem, um `SupabaseStore` com a mesma forma substitui o `MemoryStore` (`src/lib/datasource.ts`), sem tocar nos serviços. As Server Actions/páginas do Next consomem os serviços (ex.: `src/app/portal/nova/actions.ts`).
