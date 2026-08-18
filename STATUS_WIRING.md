# Status do WIRING da interface (conexão à Supabase)

> **Importante sobre verificação:** neste ambiente o registro de pacotes está bloqueado, então **não foi possível `npm install`, typecheck, `next build` nem abrir no navegador aqui**. O código foi escrito com cuidado e os módulos de servidor (`.ts`) passam na verificação de sintaxe; a lógica de negócio continua com **55 asserções, 0 falhas**. A validação no navegador precisa ser feita por você, localmente — e este primeiro wiring provavelmente exigirá 1–2 rodadas de ajuste a partir dos erros reais que aparecerem. Cole aqui qualquer erro do terminal/console (sem as chaves) que eu corrijo com precisão.

## 1. O que foi conectado (código pronto)
- **Backbone de dados no servidor** (`src/server/data/*` + `src/server/context.ts`): reusa as regras já testadas (permissões, 24h, dedupe de Drive, checklist de impressão, transições de Kanban) e persiste no Supabase via RLS.
- **Painel** (`/app/painel`): indicadores **reais** (contagens no banco), atalhos e badge de atraso calculado.
- **Central de Solicitações** (`/app/solicitacoes`): lista real + triagem (aprovar→demanda, pedir info, recusar) com atualização via `revalidatePath`.
- **Demandas** — **Tabela** (`/app/demandas`) e **Kanban** (`/app/demandas/kanban`): dados reais; Kanban com **arrastar-e-soltar**, atualização otimista e **reversão** quando o servidor recusa a transição (permissão/etapa crítica/transição inválida).
- **Detalhe da demanda** (`/app/demandas/[id]`): abas Resumo, **Versões** (adicionar link do Drive com validação/dedupe), **Aprovações** (aprovar × liberar publicação), **Impressão** (dupla aprovação + liberar), **Histórico** (auditoria real).
- **Recortes por tipo**: `/app/criacao`, `/app/audiovisual`, `/app/impressos` (demandas filtradas).
- **Portal do Solicitante**: início (`/portal`), **Nova solicitação** em etapas (`/portal/nova`, com 24h validado no servidor) e detalhe com **mensagens** (`/portal/[id]`).
- **Portal da Gráfica**: lista (`/grafica`) e detalhe (`/grafica/[id]`) com **confirmar versão** e atualizar produção (só pedidos atribuídos, só versão liberada — via RLS).
- **Notificações** (`/app/notificacoes`): lista + marcar como lida.
- **Calendário, Conversas, Arquivadas, Administração**: rotas reais e **guardadas** (Administração exige permissão, inclusive contra acesso por URL direta).
- **e2e (Playwright)**: specs de login por perfil, navegação, nova solicitação, triagem, Kanban e bloqueios de acesso.

## 2. Rotas funcionais
`/login`, `/ativar`, `/recuperar` · `/app/painel`, `/app/solicitacoes`, `/app/demandas`, `/app/demandas/kanban`, `/app/demandas/[id]`, `/app/criacao`, `/app/audiovisual`, `/app/impressos`, `/app/calendario`, `/app/conversas`, `/app/arquivadas`, `/app/admin`, `/app/notificacoes` · `/portal`, `/portal/nova`, `/portal/[id]` · `/grafica`, `/grafica/[id]`.

## 3. Como testar cada perfil (senha `Homolog@2026`)
- **Coordenador** `coord@maracas.ba.gov.br`: Painel → Central de Solicitações → aprovar uma solicitação (vira demanda) → Demandas (Tabela/Kanban) → abrir demanda → adicionar versão (link do Drive) → aprovar → liberar publicação.
- **Diretor** `diretor@maracas.ba.gov.br`: repetir aprovação; em impresso, aprovar junto com o Coordenador na mesma versão e **Liberar para impressão**.
- **Designer** `designer@maracas.ba.gov.br`: mover cartões no Kanban (produção); tentar aprovar → deve ser bloqueado; tentar `/app/admin` → redirecionado.
- **Social Media** `social@maracas.ba.gov.br`: registrar publicação.
- **Solicitante Saúde** `saude@maracas.ba.gov.br`: nova solicitação (teste prazo < 24h → bloqueia) → acompanhar → mensagens. Não vê a secretaria da Educação.
- **Solicitante Educação** `educacao@maracas.ba.gov.br`: só enxerga as suas.
- **Gráfica** `grafica@boaimpressao.com.br`: ver só seus pedidos → confirmar versão → atualizar produção.
- **Visualizador** `leitura@maracas.ba.gov.br`: navega em leitura.
- **Administrador** `admin@maracas.ba.gov.br`: acessa Administração (usuários, convites, secretarias, gráficas).

## 4. Testes a executar
1. `npm run test:local` → esperado **55 asserções, 0 falhas** (já verificado aqui).
2. `npm test` (Vitest) e `npm run e2e` (Playwright, com `npm run dev` no ar) → **rodar na sua máquina** (dependem de instalar e do Supabase).
3. Conferir o **console do navegador** sem erros e a **persistência** após recarregar.

## 5. Pendências reais (próximo incremento)
- **Conversas em tempo real** (Supabase Realtime) na tela — a lógica (grupos, menções, não lidas, pesquisa, edição/exclusão lógica) já existe; falta a UI de mensagens ao vivo.
- **Calendário** com visões mês/semana/dia interativas (hoje é lista real) e criação de evento pela tela.
- **CRUD administrativo** completo (criar usuário/convite/secretaria pela tela) — hoje as páginas listam; criação de usuário existe no script de seed.
- **Ficha técnica do impresso** editável pela tela (hoje exibida; criação do pedido via dados).
- **Ajustes finos de responsividade** validados no navegador (tablet/celular).
- **Iteração a partir de erros reais** do primeiro `npm run dev` (esperado neste tipo de wiring feito sem execução local minha).

## 6. Pronto para publicar na Vercel?
**Ainda não.** Primeiro rode localmente (`npm run dev`), faça o passo a passo de testes por perfil e me relate os erros para eu corrigir. Quando os fluxos principais rodarem sem erros no seu navegador e os dados persistirem, aí sim preparamos a publicação da homologação na Vercel. **Não publiquei nada** e **não configurei e-mail/domínio** nesta rodada.
