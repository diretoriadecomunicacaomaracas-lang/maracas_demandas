# IMPLANTAÇÃO

## Ambientes
- **Local:** desenvolvimento (`npm run dev`, Supabase local via CLI).
- **Homologação:** projeto Supabase + deploy Vercel de preview, com dados de seed. Validação antes dos usuários reais.
- **Produção:** só após autorização explícita. **Não** publicar em produção nesta etapa.

## Passo a passo (homologação)
1. Criar projeto no **Supabase**; copiar URL e chaves (anon e service_role).
2. Aplicar migrations: `supabase db push` (ou `supabase db reset` local) usando `supabase/migrations/*` e `supabase/seed.sql`.
3. Criar usuários de homologação: `npx tsx scripts/seed-demo-users.ts` (exige `SUPABASE_SERVICE_ROLE_KEY`). Senhas em `docs/CONTAS_HOMOLOGACAO.md` (nunca em produção).
4. Configurar e-mail (`CONFIGURACAO_EMAIL.md`).
5. Deploy na **Vercel**; definir todas as variáveis do `.env.example` no painel do projeto.
6. Configurar o **cron** do resumo diário de atrasos (Vercel Cron → rota protegida por `CRON_SECRET`, agendada 08:00 America/Sao_Paulo).
7. Rodar `npm run e2e` apontando para a URL de homologação.

## Variáveis (todas em `.env.example`)
Supabase (URL, anon, service_role) · E-mail (Resend/SMTP + FROM) · App (URL, timezone, CRON_SECRET).

## Checklist de segurança pré-produção
RLS ativa em todas as tabelas sensíveis · service_role só no servidor · testes de permissão verdes · política de senha e bloqueio por tentativas · backups do Supabase · revisão de logs de auditoria.
