# STATUS — Grande Rodada de Finalização Funcional (v1.0)

Ponto de recuperação desta rodada. Atualizado durante a implementação.

## Fase atual
Rodada 1 da finalização entregue (subconjunto seguro que compila e preserva o que já funcionava). Demais fases documentadas como pendentes para as próximas rodadas.

## Concluído nesta rodada
- **Fase A — Planejamento (core):** item no menu entre Solicitações e Demandas; `/app/planejamento` com **backlog** (solicitações aprovadas e demandas internas não programadas, com busca/filtro), **calendário mensal** (semana começa na segunda, navegação, hoje), **+ Nova demanda interna** (reusa demandas/subdemandas, sem solicitação externa) e **Agendar** (cria evento no calendário). Edição restrita a Diretor/Coordenador/Social/Admin (`podePlanejar`).
- **Fase B — Demandas abre no Kanban:** `/app/demandas` agora tem `Kanban | Tabela | Finalizadas`, **Kanban como visão inicial**, filtros preservados entre visões. Tarefas continuam abrindo `/app/demandas/[id]`.
- **Fase D — Finalizadas / Lixeira / Exclusão lógica:** aba **Finalizadas**; **Excluir demanda** (motivo obrigatório, exclusão lógica, preserva histórico/links/versões/comentários/aprovações) na página da tarefa; **/app/lixeira** com **restaurar** (Admin/Diretor/Coordenador).
- **Fase E — Painel Criação:** dashboard operacional (resumo + por profissional + cartões), toggle `Minha fila | Equipe`.
- **Fase F — Painel Audiovisual:** mesmo modelo, buckets de gravação/edição/revisão.
- **Fase G — Painel Impressos:** gerencial por etapa + **por gráfica**.
- **Fase H — Calendário compartilhado:** `/app/calendario` reusa o calendário mensal (somente leitura), alimentado pelo Planejamento; impressos não entram.
- **Fase M (parcial):** notificações já disparadas em agendamento e criação de demanda interna (sem notificar o autor).
- **Fase N (parcial):** a Busca Global já indexa automaticamente as novas demandas/subdemandas (fallback lê todas as subdemandas via RLS). Campanhas/anexos entram quando implementados.

## Pendente (próximas rodadas)
- **Fase A avançada:** arrastar item do backlog para o calendário (drag&drop), visões semana/dia/agenda, redimensionar/duração por arraste.
- **Fase C:** consolidar macroetapas dos fluxos (digital/audiovisual/impresso) — mantido o fluxo atual para não quebrar o Kanban aprovado e seus testes; requer atualizar `src/domain/flows.ts` + testes juntos.
- **Fase C (audiovisual):** modalidades múltiplas (Vídeo/Fotos/Stories) — precisa de coluna nova (SQL).
- **Fase I — Conversas:** chat de grupos com Realtime/menções/não lidas — schema existe (`grupos_conversa`, `mensagens`, `mensagem_leituras`, `mensagem_mencoes`); falta UI + realtime.
- **Fase J — Administração completa:** CRUD de equipe/solicitantes/convites/secretarias/unidades/gráficas/grupos/permissões — operações de Auth só no servidor; nunca expor `service_role`.
- **Fase K/L — Anexos (Supabase Storage):** bucket privado + URLs assinadas + validação (tipo/tamanho) — precisa de PATCH SQL (bucket/policies) e código de upload no servidor.
- **Fase P:** validação de responsividade ampla (tablet/celular) das telas novas — layouts base já responsivos.
- **Fase R:** ampliar e2e Playwright para os novos fluxos.

## SQL necessário
- **PATCH_0007_busca_e_visibilidade.sql** — ainda **não aplicado**. Necessário para: comentários internos nas Mensagens, protocolo de demanda na busca, e busca acento-insensível/indexada. O subconjunto entregue nesta rodada **não depende dele** (Planejamento/Kanban/Finalizadas/Lixeira/painéis funcionam no schema atual).
- **PATCH_0008 (futuro, consolidado):** modalidades audiovisual, anexos/Storage e quaisquer colunas de Conversas/Admin que faltarem. Ainda **não criado** — será um único patch aditivo/idempotente quando essas fases forem implementadas.

## Testes executados
- `npm.cmd run typecheck`: 0 erros.
- `npm.cmd run test:local`, `npm.cmd test`, `npm.cmd run build`: ver execução ao fim da rodada.

## Bloqueios reais
- Ambiente sandbox sem rede externa ao Supabase: validação autenticada é feita no navegador do responsável.
- Nenhum bloqueio de código no subconjunto entregue.
