# Relatório de entrega — partes que independem de credenciais

Cobre tudo o que foi implementado localmente, conforme solicitado. As decisões de `IMPEDIMENTOS_E_DECISOES.md` estão aprovadas e mantidas.

## 1. Fases implementadas
- **Fase 0 — Auditoria e preparação (concluída):** leitura dos 10 materiais, arquitetura, estrutura de pastas, entidades, plano de migrations, fases, credenciais. Protótipo preservado em `referencias/prototipo-aprovado/`. Git inicializado.
- **Fase 1 — Fundação (concluída, independe de credenciais):** app Next.js/TS/Tailwind (tokens do Design System), banco (schema + RLS + seed), autenticação preparada (login/ativação/recuperação/callback + middleware de ambientes), cargos/permissões (matriz em TS + testes), secretarias/unidades/gráficas/grupos, UI base fiel ao protótipo (Button, StatusChip, Sidebar drawer acessível, AppShell), Painel/Portal do Solicitante/Portal da Gráfica com leitura real via RLS.
- **Ajustes obrigatórios da Etapa 3 (concluídos):**
  - **Links do Drive por ID de arquivo:** normalização (`src/lib/drive.ts`) + extração no banco (`drive_file_id()`), colunas + triggers, índice único por ID, dedupe com **mensagem amigável** antes do erro do banco (`src/server/versoes.ts`), erro claro quando o link não é um arquivo do Drive.
  - **Liberar impressão:** `validar_liberacao_impressao()`/`pode_liberar_impressao()` com checklist completo; espelho em TS (`src/lib/impressao.ts`); ação **manual** (Diretor ou Coordenador).

Pendentes das próximas rodadas (parte independe de credenciais e será implementada; parte exige credenciais para rodar): Fases 2–7 (Solicitações/triagem, Demandas/Kanban com arrastar validado no servidor, Aprovações/Impressos/Portal da Gráfica completos, Calendário/Notificações/e-mails, Conversas, suíte de testes e2e). Ver `PENDENCIAS_IMPLEMENTACAO.md`.

## 2. Testes executados e resultados
- **Permissões** (`permissions.test.ts`): diretor aprova/libera; coordenador não altera permissões; designer move mas não aprova; solicitante/visualizador sem permissões; impresso exige coordenador+diretor; ambiente por acúmulo. → **OK** (lógica executada em Node).
- **Regras temporais** (`rules.test.ts`): atraso é indicador (ignora etapas terminais); 24h de antecedência. → **OK**.
- **Drive** (`drive.test.ts`): 3 formatos do mesmo arquivo → mesmo ID; docs/sheets/slides/folders; URL canônica; erro quando não é Drive. → **OK**.
- **Impressão** (`impressao.test.ts`): checklist completo libera; bloqueios por 2ª aprovação, versão não vigente/substituída, ficha técnica e liberação incompatível. → **OK**.
- **Sintaxe:** 20 módulos `.ts` verificados (Node 22 `--check`) — sem erros. SQL: parênteses/blocos `$$` balanceados nas 4 migrations.
> Observação: `npm test` (Vitest) e Playwright rodam localmente após `npm install`; a verificação acima foi feita executando a lógica pura e o `--check`, pois o ambiente atual não instala dependências externas.

## 3. Lista das migrations
- `0001_schema.sql` — tabelas, enums, índices (link único textual por versão ativa).
- `0002_functions_triggers.sql` — helpers de RLS, updated_at, 24h, invalidação por nova versão, auditoria.
- `0003_rls.sql` — políticas RLS por ambiente (interno/solicitante/gráfica).
- `0004_drive_e_impressao.sql` — `drive_file_id()`, colunas/triggers, índice por ID, `validar_liberacao_impressao()`/`pode_liberar_impressao()`.
- `seed.sql` — cargos, permissões, matriz, secretarias/unidades, gráficas, grupos.

## 4. Resumo das políticas de segurança
Defesa em profundidade: **RLS no banco** (última linha) + **guardas no servidor** (`src/server/guard.ts`) + UI condicional. Solicitante vê só a sua **secretaria principal** (restrita como exceção); interno isolado de solicitante/gráfica; **gráfica** só pedidos atribuídos e apenas a **versão liberada**; notificações só do destinatário; conversas só para internos membros. Permissões críticas protegidas; senha nunca em texto aberto; convite com link de uso único (24h); soft delete. Detalhes em `PERMISSOES_E_RLS.md`.

## 5. Contas fictícias de homologação
Em `docs/CONTAS_HOMOLOGACAO.md` (senha padrão `Homolog@2026`, só homologação): Administrador, Diretor, Coordenador, Designer, Videomaker, Social Media, Solicitante (Saúde), Solicitante (Educação), Gráfica, Visualizador. Criadas por `scripts/seed-demo-users.ts` (usa `SUPABASE_SERVICE_ROLE_KEY`).

## 6. Variáveis de ambiente (exatas — ver `.env.example`)
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `EMAIL_PROVIDER` · `RESEND_API_KEY` · `EMAIL_FROM` · `SMTP_HOST` · `SMTP_PORT` · `SMTP_USER` · `SMTP_PASSWORD` · `NEXT_PUBLIC_APP_URL` · `APP_TIMEZONE` (America/Sao_Paulo) · `CRON_SECRET`.

## 7. Criar e conectar o Supabase (passo a passo)
1. Crie um projeto em supabase.com. 2. Em *Project Settings → API*, copie **Project URL**, **anon key** e **service_role key**. 3. Cole em `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). 4. Instale a Supabase CLI e faça `supabase link`. 5. Aplique o schema: `supabase db push` (ou `supabase db reset` local) usando `supabase/migrations/*` e `supabase/seed.sql`. 6. Rode `npx tsx scripts/seed-demo-users.ts` para criar as contas de homologação. *(Executar só quando as chaves estiverem no `.env.local` — item 10.)*

## 8. Configurar os e-mails (passo a passo)
1. Crie conta na Resend e **verifique um domínio**. 2. Copie a **API key**. 3. Em `.env.local`: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY=...`, `EMAIL_FROM="Comunicação Maracás <no-reply@SEU-DOMINIO>"`. 4. Alternativa SMTP: `EMAIL_PROVIDER=smtp` + `SMTP_*`. Detalhes e lista de eventos em `CONFIGURACAO_EMAIL.md`.

## 9. Publicar a homologação na Vercel (passo a passo)
1. Importe o repositório na Vercel. 2. Em *Settings → Environment Variables*, cadastre **todas** as variáveis do `.env.example` (nunca no código). 3. Deploy (preview/homologação). 4. Configure **Vercel Cron** para o resumo diário de atrasos (08:00 America/Sao_Paulo → rota protegida por `CRON_SECRET`). 5. Rode `npm run e2e` apontando para a URL de homologação. **Não** publicar em produção sem autorização.

## 10. Quando inserir as credenciais
As credenciais entram **somente** no arquivo `.env.local` (ambiente local) ou no **painel seguro** do serviço (Supabase/Resend/Vercel) — **nunca** dentro desta conversa e nunca no código. O momento exato é **antes** de executar operações que dependem das contas: aplicar migrations no Supabase real (item 7), criar usuários de homologação, configurar e-mail (item 8) e publicar na Vercel (item 9). Até lá, todo o restante (código, migrations, RLS, permissões, testes, docs) já está pronto e verificado localmente.
