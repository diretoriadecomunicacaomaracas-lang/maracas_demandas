# DEPLOY — v1.0.0-rc.1 (Maracás Demandas)

Guia operacional para publicar a RC. Não contém segredos. Não executa nada automaticamente.

## 1. Pré-requisitos
- Projeto Supabase ativo (o mesmo usado em homologação — schema 0001→0006 já aplicado).
- Conta Vercel com acesso ao repositório.
- Domínio/URL de produção da Vercel (ex.: `https://SEU-APP.vercel.app`).

## 2. SQL a aplicar (SQL Editor do Supabase, nesta ordem)
Ambos são **aditivos e idempotentes** (sem DROP destrutivo, com RLS/grants). O app funciona sem eles em modo degradado, mas para a homologação com usuários reais **aplique os dois**:
1. `supabase/PATCH_0007_busca_e_visibilidade.sql` — busca acento-insensível + protocolo de demanda + coluna `visibilidade` e RLS das mensagens (comentário interno).
2. `supabase/PATCH_0008_perfil_chat_retencao.sql` — bucket `avatares` (Storage), policy de insert do chat, função `purgar_lixeira_expirada()` (retenção 30 dias).

Sem 0007: busca usa fallback (sensível a acento) e comentário interno da solicitação fica indisponível.
Sem 0008: upload de avatar cai para “usar URL” e a purga automática da Lixeira não roda.

## 3. Variáveis da Vercel (Project Settings → Environment Variables)
Obrigatórias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`  ← **server-only**, nunca marcar como pública/NEXT_PUBLIC
- `NEXT_PUBLIC_APP_URL`  ← URL final da Vercel (usada em links de convite)

Opcionais:
- `APP_TIMEZONE` (default `America/Sao_Paulo`)
- `EMAIL_PROVIDER` / `RESEND_API_KEY` / `EMAIL_FROM` (apenas se usar as notificações por e-mail do app)
- `CRON_SECRET` (se agendar rotinas)

Copie os nomes de `.env.example` (placeholders). Nunca copie valores do `.env.local`.

## 4. Deploy Vercel
- Framework: **Next.js** (detecção automática). Build: `next build`. Node 18+.
- Importar o repositório, definir as variáveis acima, publicar. Não é necessário ajustar `next.config.mjs`.

## 5. Configuração Supabase Auth
- Authentication → URL Configuration → **Site URL** = `NEXT_PUBLIC_APP_URL` (URL da Vercel).

## 6. Redirect URLs (Supabase Auth → Redirect URLs)
Adicionar:
- `https://SEU-APP.vercel.app/auth/callback`
- `https://SEU-APP.vercel.app/ativar`
- `https://SEU-APP.vercel.app/redefinir`
(o código usa `window.location.origin` na recuperação e `NEXT_PUBLIC_APP_URL` no convite — sem URL hardcoded).

## 7. SMTP (entrega de e-mails do Auth: recuperação e convite)
- Por padrão o projeto usa o **SMTP interno do Supabase** (limites baixos, pode cair em spam).
- **Ação manual:** Authentication → SMTP Settings → configurar **Custom SMTP** (ex.: Resend/SES/SMTP próprio) e validar remetente.
- Teste real: enviar 1 recuperação e 1 convite para um endereço real e confirmar recebimento.

## 8. Storage (avatar)
- Após o PATCH_0008, o bucket `avatares` (público) existe com policies de escrita restritas ao próprio usuário.
- Sem o patch, o upload de foto fica indisponível (o app oferece “usar URL”).

## 9. Smoke test (pós-deploy)
`/login` (claro/escuro) → login Coordenador → `/app/painel` → `/app/solicitacoes` → `/app/planejamento` → `/app/demandas` (Kanban) → abrir uma demanda → Criação/Audiovisual/Impressos → Calendário → Bate-papo → Arquivadas → Perfil → Configurações → Administração (só Diretor/Admin) → Portal do Solicitante → Portal da Gráfica → logout. Verificar console sem erros.

## 10. Rollback
- Reverter para esta RC: `git checkout v1.0.0-rc.1` (após a tag existir) e re-deploy desse commit na Vercel (Deployments → Redeploy do commit da tag).
- SQL dos patches é aditivo/idempotente; rollback de código não exige rollback de banco.
