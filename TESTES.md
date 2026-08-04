# TESTES

## Ferramentas
- **Vitest** — unitários das regras críticas (`tests/unit`).
- **Playwright** — end-to-end dos fluxos (`e2e`).

## Como rodar
`npm test` (unit) · `npm run e2e` (precisa da app rodando/`webServer` configurado).

## Cobertura unitária atual (Fase 1)
- `permissions.test.ts`: diretor aprova/libera; coordenador não altera permissões; designer move mas não aprova; solicitante/visualizador sem permissões; impresso exige coordenador+diretor; ambiente por acúmulo de cargos.
- `rules.test.ts`: atraso é indicador (ignora etapas terminais); solicitação externa exige 24h.

**Validação executada nesta entrega:** a lógica de permissões foi executada em Node e todas as asserções passaram; os 13 módulos `.ts` passam em verificação de sintaxe (Node 22 `--check`).

## Testes obrigatórios (mapa v2.2 → onde entram)
| Regra | Camada | Fase |
|---|---|---|
| Solicitante não acessa interno | RLS + middleware | 1/2 |
| Solicitante vê só a própria secretaria | RLS `solic_select` | 2 |
| Solicitação restrita respeita exceções | RLS | 2 |
| Gráfica vê só pedidos atribuídos | RLS `pedido_select` | 4 |
| Digital exige aprovação válida | server + `aprovacoes` | 4 |
| Liberação de publicação é separada | `liberacoes` | 4 |
| Impresso exige as duas aprovações da mesma versão | `pode_liberar_impressao` | 4 |
| Nova versão invalida aprovações | trigger | 3/4 |
| Gráfica confirma nova versão | `confirmacoes_grafica` | 4 |
| Prazo externo < 24h bloqueado | trigger + app | 2 |
| Membro move produção / não aprova | permissions | 3 |
| Atraso é indicador, não status | `estaAtrasada` | 1 |
| Reabertura preserva histórico | auditoria + regra | 3 |
| Exclusão é lógica | soft delete | 1 |
| Datas no horário de Brasília | `dates.ts` | 1 |
| Permissões validadas no servidor | `server/guard` | 1 |
| Links antigos não aparecem no Portal da Gráfica | RLS `ver_grafica_read` | 4 |

## E2E (a expandir por fase)
`smoke.spec.ts` já valida o redirecionamento de rota protegida → login. Próximos: login por perfil, nova solicitação com 24h, triagem→demanda, Kanban, dupla aprovação, Portal da Gráfica.

## Atualização — testes dos ajustes obrigatórios
- `drive.test.ts`: formatos diferentes do mesmo arquivo → mesmo ID; docs/sheets/slides/folders reconhecidos; URL canônica; erro claro quando não é arquivo do Drive. **Executado: OK.**
- `impressao.test.ts`: libera só com checklist completo; bloqueia sem 2ª aprovação, versão não vigente/substituída, ficha técnica incompleta e liberação incompatível. **Executado: OK.**

## Fases 2–7 — camada de domínio (executável localmente, sem credenciais)
Rodar: `npm run test:local` (usa `tsx`, incluído no projeto; compatível com Node 18/20/22; não exige Vitest). Resultados obtidos nesta entrega:
- **Lógica pura** (`tests/run-all.ts`): 8/8 OK — permissões, dupla aprovação, ambiente por acúmulo, dedupe de Drive, checklist de impressão, regra de 24h, atraso como indicador.
- **Integração de fluxos** (`tests/integration/fluxos.test.ts`): **44/44 OK** — Portal de Solicitações + triagem + visibilidade por secretaria + restrita + 24h; demandas/subdemandas; Kanban com transições validadas (avanço/devolução, bloqueio de etapa crítica, não-membro); versões com dedupe por ID do Drive; aprovação digital (aprovar × liberar separados); impressos (dupla aprovação na mesma versão + checklist + liberação manual); Portal da Gráfica (só pedidos atribuídos, confirmação, invalidação por nova versão); notificações internas + e-mails só de eventos importantes; conversas (menções, não lidas, pesquisa, bloqueio de externo); reabertura (validade das aprovações) + auditoria + exclusão lógica.
- **Calendário** (`tests/integration/calendario.test.ts`): 3/3 OK — evento no mês (UTC→exibição Brasília), isolamento do solicitante, alerta 24h antes.
Total: **55 asserções, 0 falhas.** Também: `vitest` (`tests/unit/*`) e Playwright (`e2e/*`) prontos para rodar após `npm install`.
