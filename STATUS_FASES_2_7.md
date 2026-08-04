# Status — Fases 2 a 7 (o que roda localmente, sem credenciais)

## 1. O que está realmente funcional (testado localmente)
Toda a **lógica de negócio** das 14 áreas, executável e testada em Node (`npm run test:local`), contra um banco em memória com dados fictícios:
1. **Portal de Solicitações + Central de Triagem** — criação com protocolo, **regra de 24h**, visibilidade por **secretaria principal**, solicitação **restrita**, triagem (pedir info/ajustar prazo/recusar/cancelar/**aprovar→demanda**).
2. **Demandas e subdemandas** — criação, campos administrativos (Diretor/Coord.) × operacionais (membros), arquivar/excluir lógico/restaurar.
3. **Tabela e Kanban** — **transições validadas no servidor** (avanço, devolução, bloqueio de etapa crítica, bloqueio de não-membro) com registro de histórico.
4. **Links e versões do Drive** — **dedupe por ID do arquivo** (formatos diferentes = mesmo arquivo), URL canônica, mensagem amigável, recusa de link não-Drive; nova versão **invalida** aprovações/liberações/confirmações.
5. **Aprovações digitais/audiovisuais** — **Aprovar** e **Liberar para publicação** como ações **separadas**, cada uma por Diretor **ou** Coordenador.
6. **Impressos** — **dupla aprovação** (Coordenador **e** Diretor na mesma versão) + **checklist completo** + **liberação manual** (nunca automática).
7. **Portal da Gráfica** — vê só pedidos atribuídos, confirma a versão liberada, atualiza produção; substituição de versão exige nova confirmação.
8. **Calendário editorial** — eventos em UTC exibidos em Brasília, consulta por período, **alertas 24h/1h/no horário**; isolado do solicitante.
9. **Notificações internas** — central por evento (atribuição, etapa, menção, etc.).
10. **E-mails** — **fila** apenas para eventos importantes (envio real via `src/server/email.ts` quando houver credencial).
11. **Conversas internas** — grupos, menções, não lidas, pesquisa básica, edição/exclusão lógica; externos bloqueados; sem conversas privadas; sem upload.
12. **Histórico e auditoria** — toda ação relevante registrada (autor, ação, valores, justificativa); **soft delete**.
13. **Testes** — 55 asserções (8 lógica + 44 integração + 3 calendário), **0 falhas**; suíte Vitest/Playwright pronta para `npm install`.
14. **Responsividade e acessibilidade** — base aplicada na UI (Sidebar drawer acessível, labels/aria/foco, portais responsivos); refino visual completo ocorre ao rodar a UI.

## 2. O que foi testado
`npm run test:local` executa e **passa**: lógica pura (permissões, dedupe Drive, checklist de impressão, 24h, atraso), integração ponta a ponta dos fluxos e calendário. Saída registrada em `TESTES.md`. Sintaxe de 30 módulos `.ts` verificada (Node 22).

## 3. O que ainda depende de credenciais
- **Executar a UI no navegador** e a integração real: exige `npm install` + banco Supabase (aplicar migrations), e-mail (Resend/SMTP) e deploy (Vercel).
- **Envio real de e-mails** e **Realtime** (conversas/notificações ao vivo) — a lógica está pronta; falta a chave/serviço.
- **RLS em banco real** — as políticas estão escritas (`supabase/migrations/0003_rls.sql`); precisam ser aplicadas num projeto Supabase.

## 4. Contas que você precisa criar (nenhuma chave vai para a conversa)
1. **Supabase** — 1 projeto (dev/homologação). Você obterá: Project URL, anon key, service_role key.
2. **Resend** (ou um servidor **SMTP**) — 1 conta + 1 domínio verificado. Obterá: API key + remetente.
3. **Vercel** — 1 conta para publicar a homologação.

## 5. Passo a passo mais simples (por serviço)
**Supabase:** criar projeto → copiar URL + anon + service_role → colar em `.env.local` → `supabase db push` (migrations + seed) → `npx tsx scripts/seed-demo-users.ts`.
**E-mail (Resend):** criar conta → verificar domínio → copiar API key → `.env.local`: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`.
**Vercel:** importar o repositório → cadastrar as variáveis do `.env.example` no painel → deploy de preview → configurar o Cron 08:00 (America/Sao_Paulo) do resumo de atrasos.
(Detalhes em `IMPLANTACAO.md`, `CONFIGURACAO_EMAIL.md` e `RELATORIO_ENTREGA.md`.)

## 6. Pronto para homologação?
**A lógica do MVP está pronta e verificada localmente.** Para a **homologação navegável** (usuários reais clicando na interface) faltam apenas duas coisas, ambas suas: (a) criar as 3 contas acima e colar as variáveis no `.env.local`/painéis; (b) rodar `npm install`, aplicar as migrations e publicar na Vercel. Feito isso, o sistema entra em homologação. **Não publiquei nada e não solicitei chaves aqui** — as credenciais entram só no `.env.local` ou nos painéis seguros.
