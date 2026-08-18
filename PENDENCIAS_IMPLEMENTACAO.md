# PENDÊNCIAS DE IMPLEMENTAÇÃO

## Concluído (Fase 0 + Fase 1 — fundação)
- Auditoria, arquitetura, esqueleto do projeto, protótipo preservado, logo como asset, fonte local.
- Banco: schema completo, funções/triggers de regras (24h, invalidação, liberação de impressão), RLS por ambiente, seed (cargos, permissões, matriz, secretarias/unidades, gráficas, grupos).
- App: clientes Supabase, middleware de ambientes, permissões em TS + testes, guard de servidor, e-mail desacoplado, UI base (Button, StatusChip, Sidebar drawer, AppShell), login + callback + página de Painel com leitura real.

## A implementar (Fases 2–7)
- **Fase 2:** Portal do Solicitante (formulário em etapas com 24h), Central de Solicitações, triagem, conversão em demanda, mensagens.
- **Fase 3:** CRUD de demandas/subdemandas; Tabela (filtros/ordenação/agrupamento/paginação); Kanban com **arrastar validado no servidor** (permissão + transição + aprovação + histórico) e atualização otimista com rollback; links/versões (alerta de link repetido); comentários; histórico; reabertura/arquivamento/exclusão lógica.
- **Fase 4:** Aprovação digital (aprovar × liberar), dupla aprovação de impresso, liberação única, Portal da Gráfica (confirmação de versão, produção, entrega, foto/comprovante).
- **Fase 5:** Calendário (mês/semana/dia/lista, fuso), notificações internas + e-mails, resumo diário de atrasos (cron 8h).
- **Fase 6:** Conversas (grupos, respostas, menções, leituras, pesquisa, edição/exclusão lógica) via Realtime.
- **Fase 7:** Suíte completa de testes (unit + e2e do mapa da TESTES.md), revisão de RLS, responsividade, acessibilidade AA, performance, dados de homologação, ambiente de homologação.

## Ações humanas necessárias
Fornecer credenciais (Supabase/Resend/Vercel) e autorizar homologação. Fornecer ativos de marca pendentes (negativa/vetor/símbolo) — ver `referencias/PENDENCIAS_VISUAIS.md`.

## Atualização 0.1.1 (feita, independe de credenciais)
- Dedupe de links do Drive por **ID de arquivo** (TS + SQL + índice + mensagens amigáveis + erro quando não é Drive).
- **Validação completa** de liberar impressão (vigência, dupla aprovação na mesma versão, ficha técnica, sem liberação incompatível), mantendo a ação **manual**.
- Serviço de versão com verificação de duplicidade antes do banco.
Continua pendente das credenciais apenas: aplicar migrations em Supabase real, criar usuários, deploy Vercel, e2e contra a URL de homologação.

## Atualização 0.3.0 — wiring dos fluxos principais
Conectado (código): Painel real, Solicitações+triagem, Demandas Tabela/Kanban, Detalhe (versões/aprovações/impressão/histórico), Portais Solicitante/Gráfica, Notificações; rotas guardadas. e2e escritos.
Pendente (próximo incremento): Conversas em tempo real (Realtime), calendário interativo (mês/semana/dia) e criação de evento pela tela, CRUD administrativo completo pela tela, ficha técnica editável do impresso, e a **iteração a partir dos erros reais** do primeiro `npm run dev` na sua máquina. Ver STATUS_WIRING.md.
