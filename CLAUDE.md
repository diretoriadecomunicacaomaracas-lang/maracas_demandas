# CLAUDE.md — Regras Permanentes do Projeto

Este arquivo define as regras obrigatórias e permanentes para qualquer trabalho
assistido por IA (Claude Code) neste repositório. **Leia e siga sempre.**

Projeto: **Maracás Demandas** — Sistema de Gestão de Demandas da Comunicação da
Prefeitura de Maracás/BA (MVP).

---

## 1. Stack do projeto

- **Next.js** (App Router) — versão 14.2.x
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Postgres + Auth + RLS)
- Bibliotecas de apoio: `zod`, `date-fns`, `resend` (e-mail)
- Testes: `vitest` (unit/integração) e `@playwright/test` (e2e)

---

## 2. Ambiente e comandos (Windows / npm.cmd)

Este projeto é desenvolvido no **Windows**. Sempre usar `npm.cmd` (não `npm`)
nos comandos de terminal.

| Objetivo | Comando |
|---|---|
| Testes locais (runner próprio, sem rede) | `npm.cmd run test:local` |
| Suíte de testes (vitest) | `npm.cmd test` |
| Build de produção | `npm.cmd run build` |
| Servidor de desenvolvimento | `npm.cmd run dev` |
| Type-check | `npm.cmd run typecheck` |
| Lint | `npm.cmd run lint` |
| Testes e2e (Playwright) | `npm.cmd run e2e` |

---

## 3. Segurança e dados sensíveis

- **NUNCA** ler, exibir, copiar ou incluir em respostas o conteúdo de `.env.local`.
- **NUNCA** alterar, mover, sobrescrever ou substituir `.env.local`.
- Nunca versionar `.env`, `.env.local` ou qualquer arquivo `.env*.local`.
- Trabalhar **somente** dentro da pasta deste projeto. Nunca alterar, mover ou
  apagar arquivos fora desta pasta.

---

## 4. Banco de dados / Supabase

- **Preservar RLS e permissões** em qualquer alteração. Nunca enfraquecer ou
  remover políticas de Row Level Security sem autorização expressa.
- **NUNCA** executar migration ou qualquer SQL no Supabase sem antes **mostrar o
  conteúdo completo** e **receber autorização expressa** do responsável.
- **NUNCA** excluir tabelas, usuários ou dados do Supabase.
- Nunca rodar comandos destrutivos de banco (`db reset`, `drop`, `truncate`,
  `delete` em massa) sem autorização explícita.

---

## 5. Publicação / deploy

- **NUNCA** publicar na Vercel (ou qualquer ambiente) sem **autorização expressa**.
- Não fazer deploy, push forçado, nem publicar conteúdo automaticamente.

---

## 6. Fluxo de trabalho (Git)

- Antes de cada rodada grande de mudanças: criar um **commit de segurança** e
  registrar o estado atual.
- **NUNCA** usar `git reset --hard`.
- **NUNCA** apagar ou reescrever o histórico (`push --force`, `rebase`
  destrutivo, `filter-branch`, etc.).
- Não executar comandos destrutivos em geral.
- Sempre **registrar os arquivos alterados** ao final de cada rodada.
- Sempre **executar os testes ao final** de cada rodada.
- Sempre **criar um commit** após uma rodada aprovada.

---

## 7. Checklist obrigatório ao final de cada rodada

1. Listar todos os arquivos alterados.
2. Rodar `npm.cmd run test:local` e `npm.cmd test`.
3. Reportar erros encontrados (se houver).
4. Listar comandos que exigiram autorização.
5. Criar commit de segurança/entrega **após aprovação**.

---

## 8. Limites de autonomia

Ações que **sempre** exigem autorização expressa antes de executar:

- Rodar migrations ou SQL no Supabase (mostrar o conteúdo antes).
- Publicar / fazer deploy (Vercel ou qualquer ambiente).
- Qualquer operação destrutiva (apagar dados, tabelas, usuários, histórico).
- Instalar/atualizar dependências que alterem o comportamento de produção.

Na dúvida: **pare e pergunte** antes de agir.
