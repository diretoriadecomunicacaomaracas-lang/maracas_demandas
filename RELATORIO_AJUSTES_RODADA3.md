# Relatório da rodada — menu de usuário, notificações, portal, responsáveis e prioridade

## SQL a aplicar no Supabase
**Nenhum novo.** Esta rodada usa apenas tabelas/colunas já existentes (`notificacoes`, `usuarios.avatar_url`, `subdemandas.prioridade`, `solicitacoes.status_externo`). Se você ainda **não** rodou o `PATCH_0005.sql` da rodada anterior, rode-o agora (avatar/briefing). Fora isso, é só atualizar o código.

## 1. Menu de usuário + Sair (todos os ambientes)
- Novo `UserMenu` (avatar + nome + função; dropdown com e-mail/fuso/idioma e **Sair da conta** → encerra a sessão e volta para `/login`).
- Aparece na barra superior do **ambiente interno** (`AppShell`) e nos **cabeçalhos dos portais** (Solicitante e Gráfica) via novo `PortalHeader`.
- Arquivos: `src/components/interno/UserMenu.tsx` (novo), `src/components/interno/PortalHeader.tsx` (novo), `src/components/layout/AppShell.tsx`, `src/app/portal/page.tsx`, `src/app/grafica/page.tsx`, `src/app/grafica/[id]/page.tsx`, `src/server/data/me.ts` (novo: `getMe`).

## 2. Notificações funcionais por perfil
- Novo `NotifBell`: sino com **contador de não lidas**, **dropdown** com as recentes, “marcar todas como lidas”, clique abre o item; **atualiza sozinho** a cada 30 s (polling).
- **Geração por evento**, sempre para quem está **envolvido**:
  - Aprovar solicitação → notifica **responsável e colaboradores** atribuídos.
  - Triagem (análise, pedir info, recusar, cancelar, aprovar) → notifica o **solicitante**.
  - Mover etapa no Kanban / aprovar / liberar publicação / finalizar → notifica os **envolvidos** na demanda.
  - Atribuir responsável / adicionar colaborador → notifica **essa pessoa**.
  - Liberar impressão → notifica a **gráfica** do pedido.
- Como notificar terceiros exige contornar a RLS com segurança, a inserção usa a chave de serviço **no servidor** (`src/server/notify.ts`), nunca no navegador.
- Arquivos: `src/server/notify.ts` (novo), `src/components/interno/NotifBell.tsx` (novo), `src/server/data/me.ts`, e ganchos em `solicitacoes.ts`, `demandas.ts`, `aprovacoes.ts`.

## 3. Portal do Solicitante — sub-abas
- **Enviadas** (enviada / em análise / aguardando informações), **Aprovadas (em execução)** (aprovada), **Finalizadas** (concluída / recusada / cancelada — funciona como arquivo).
- Para alimentar “Finalizadas”, adicionei a ação **Finalizar demanda** (Diretor/Coordenador) no detalhe: finaliza a subdemanda e marca a solicitação vinculada como **concluída**.
- Arquivos: `src/app/portal/page.tsx`, `src/server/data/demandas.ts` (`finalizarDemanda`), `src/components/interno/DetalheDemanda.tsx`.

## 4. Responsável só com ícones
- Tabela e Kanban passam a mostrar **apenas os avatares** (responsável + colaboradores, lado a lado, empilhados), **sem o nome** — o nome/função aparece no **tooltip** ao passar o mouse. Sem responsável: um ícone “?” tracejado (“Aguardando distribuição”).
- Arquivos: `src/app/app/demandas/page.tsx`, `src/components/interno/KanbanBoard.tsx` (usam `AvatarStack`).

## 5. Prioridade na Tabela e no Kanban
- **Tabela:** nova coluna **Prioridade** (chip com rótulo e cor: Emergencial/Alta/Média/Baixa).
- **Kanban:** indicador **compacto** (losango colorido com tooltip “Prioridade: …”), para não ocupar espaço.
- Arquivo novo: `src/components/ui/Priority.tsx`.

## Verificação
- 48 módulos `.ts` de servidor/domínio checados (sem erros); **73 asserções, 0 falhas** (`npm run test:local`).
- Componentes `.tsx` com chaves/parênteses balanceados (não executo o navegador aqui).

## Roteiro curto de teste
1. (Se ainda não rodou) aplique `PATCH_0005.sql`. Atualize o código; `npm install` se necessário. `npm run test:local` (73/0). `npm run dev`.
2. **Sair:** em qualquer perfil (interno, solicitante, gráfica), clique no seu avatar no canto superior direito → **Sair da conta** → volta ao `/login`.
3. **Notificações:** como **Coordenador**, aprove uma solicitação escolhendo um **Designer** como responsável. Faça login como esse **Designer** → o **sino** mostra contador; abra e clique na notificação → vai para a demanda. Mova o cartão no Kanban como Designer → o Coordenador/envolvidos recebem notificação (aguarde ~30 s ou reabra o sino).
4. **Portal sub-abas:** como **Solicitante**, veja **Enviadas**; após o Coordenador aprovar, aparece em **Aprovadas (em execução)**; após **Finalizar demanda** (Coordenador), migra para **Finalizadas**. O solicitante também recebe notificações dessas mudanças.
5. **Responsável só ícones + prioridade:** na **Tabela** e no **Kanban**, confira avatares sem nome (tooltip ao passar o mouse) e a **prioridade** (coluna na tabela, losango no cartão).

Nada publicado na Vercel. Rode e me diga o resultado (ou cole erros do console/terminal, sem as chaves).
