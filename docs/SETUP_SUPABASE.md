# Setup — Supabase (desenvolvimento/homologação) + rodar localmente

Guia passo a passo. **Nunca cole chaves nesta conversa** — elas entram só no arquivo `.env.local` (na sua máquina) ou nos painéis seguros dos serviços. O e-mail e o domínio oficiais ficam para depois da 1ª rodada de testes (não são necessários agora: as contas de homologação já entram com senha).

Pré-requisitos: **Node 18.18+, 20 ou 22** e **npm** instalados. (Os testes locais rodam via `tsx`, incluído nas dependências — funciona em qualquer uma dessas versões.)

---

## 1) Criar o projeto no Supabase (quais opções escolher)
1. Acesse https://supabase.com → **Sign in** → **New project**.
2. **Organization:** a sua (crie uma se pedir).
3. **Name:** `maracas-demandas-homolog`.
4. **Database Password:** gere uma senha forte e **guarde num gerenciador de senhas** (você pode precisar dela para a CLI; não é usada no `.env.local`).
5. **Region:** escolha a mais próxima — **South America (São Paulo)**.
6. **Pricing Plan:** **Free** é suficiente para homologação.
7. Clique em **Create new project** e aguarde ~2 minutos (provisionamento).

## 2) Onde achar Project URL, anon key e service_role key
No projeto criado: menu lateral **⚙ Project Settings → API**.
- **Project URL** → campo "Project URL" (ex.: `https://abcd1234.supabase.co`).
- **anon public** → em "Project API keys", a chave marcada como `anon` `public`.
- **service_role** → em "Project API keys", a chave marcada como `service_role` `secret`. **É secreta — só no servidor, nunca no navegador.**

## 3) Em qual arquivo e em quais campos inserir cada valor
Na raiz do projeto, copie o modelo e crie o `.env.local`:
```
cp .env.example .env.local
```
Abra `.env.local` e preencha **apenas estes campos por enquanto** (deixe os de e-mail em branco):
```
NEXT_PUBLIC_SUPABASE_URL=<cole a Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<cole a anon public>
SUPABASE_SERVICE_ROLE_KEY=<cole a service_role>
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_TIMEZONE=America/Sao_Paulo
```
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL (item 2).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public (item 2).
- `SUPABASE_SERVICE_ROLE_KEY` = service_role (item 2).
- E-mail (`RESEND_API_KEY`, `EMAIL_FROM`, `SMTP_*`) e `CRON_SECRET`: **deixe vazios** nesta rodada.
> O `.env.local` já está no `.gitignore` — não vai para o repositório.

## 4) Instalar as dependências
Na raiz do projeto:
```
npm install
```

## 5) Aplicar as migrations (caminho mais simples: SQL Editor)
1. No Supabase: menu lateral **SQL Editor → New query**.
2. Abra o arquivo do projeto **`supabase/HOMOLOGACAO_completo.sql`**, copie **todo** o conteúdo e cole no editor.
3. Clique em **Run**. Isso cria as tabelas, funções, triggers, as políticas de **RLS**, o controle de link do Drive/impressão e o **seed de referência** (cargos, permissões, matriz, secretarias/unidades, gráficas, grupos).
4. Confirme em **Table Editor** que as tabelas apareceram (ex.: `usuarios`, `cargos`, `secretarias`).

*(Alternativa para quem usa a Supabase CLI: `supabase link` + `supabase db push`. O caminho do SQL Editor acima é o mais direto e não exige a CLI.)*

## 6) Criar as contas fictícias de homologação
As contas de acesso precisam ser criadas no **Auth** (não dá para criar por SQL puro). Com o `.env.local` já preenchido (precisa da `service_role`):
```
npx tsx scripts/seed-demo-users.ts
```
Isso cria 10 usuários já ativos, com a **senha padrão `Homolog@2026`** (lista em `docs/CONTAS_HOMOLOGACAO.md`). Exemplos:
- `coord@maracas.ba.gov.br` (Coordenador — ambiente interno)
- `saude@maracas.ba.gov.br` (Solicitante da Saúde — Portal do Solicitante)
- `grafica@boaimpressao.com.br` (Gráfica — Portal da Gráfica)

## 7) Iniciar o sistema localmente no navegador
```
npm run dev
```
Abra **http://localhost:3000** → você cai no **/login**. Entre com um dos e-mails acima e a senha `Homolog@2026`. O sistema te leva ao ambiente do cargo (interno / solicitante / gráfica) — **sem seletor**; cada usuário vê só o seu ambiente, com a **RLS** protegendo os dados no banco.
> O que já dá para validar nesta 1ª rodada: login por perfil, roteamento por cargo, isolamento entre ambientes (RLS), dados de referência carregados, e a marca/identidade visual. A conexão com o Supabase estará confirmada. O preenchimento de demandas pela interface é a próxima etapa de wiring (a lógica já está testada — item 8).

## 8) Executar todos os testes antes de publicar
- **Lógica + fluxos** (rodam via `tsx`, já instalado com o projeto; compatível com Node 18/20/22):
```
npm run test:local
```
Esperado: **55 asserções, 0 falhas** (permissões, 24h, dedupe de Drive, dupla aprovação/checklist de impressão, Kanban validado, gráfica, calendário, conversas, reabertura/auditoria).
- **Testes unitários (Vitest):** `npm test`
- **End-to-end (Playwright):** `npm run e2e` (com o `npm run dev` rodando).

## Depois desta rodada
Quando o login e o roteamento funcionarem localmente com o Supabase, seguimos para a **publicação da homologação na Vercel** (`IMPLANTACAO.md`). Só então configuramos **e-mail (Resend/SMTP) e o domínio oficial** (`CONFIGURACAO_EMAIL.md`).

## Se algo falhar
- "Invalid API key" no login → confira se colou a **anon** em `NEXT_PUBLIC_SUPABASE_ANON_KEY` e a **service_role** em `SUPABASE_SERVICE_ROLE_KEY` (não troque as duas).
- `seed-demo-users` falhou → confirme que o SQL do item 5 rodou **antes** (precisa das secretarias/cargos) e que a `SUPABASE_SERVICE_ROLE_KEY` está no `.env.local`.
- Login "usuário sem ambiente" → rode novamente o item 6 (o perfil em `usuarios` é criado lá).
