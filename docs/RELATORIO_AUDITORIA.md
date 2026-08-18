# Relatório de auditoria dos materiais (Fase 0)

Leitura integral dos 10 materiais da Etapa 3 antes de qualquer código.

## Materiais e papel de cada um
- **Especificação v2.2** — fonte oficial das regras de negócio (prioridade 1). 40 seções + matriz de permissões + modelo conceitual.
- **prototipo_maracas.html** — referência visual oficial aprovada (prioridade 3). Preservado sem alteração em `referencias/prototipo-aprovado/`.
- **01–04 + README + PENDENCIAS (visuais)** — Design System e arquitetura de telas (prioridades 4–5).
- **Manual de Identidade + Logomarca colorida** — identidade institucional; marca oficial extraída como asset `public/brand/logo-maracas.png` (sem redesenho).

## Confirmações relevantes para a implementação
1. Três ambientes isolados (interno, solicitante, gráfica) → refletidos em rotas + RLS + `ambiente_principal`.
2. Aprovar × Liberar publicação (digital) são ações separadas → tabelas `aprovacoes` e `liberacoes`.
3. Impresso: dupla aprovação na mesma versão + ação única "Liberar para impressão" (não automática) → função `pode_liberar_impressao(versao)`.
4. Nova versão invalida aprovações/liberações/confirmações ativas → trigger `nova_versao_invalida`.
5. Um link próprio por versão; nunca sobrescrever link liberado → índice único parcial `versoes_link_unico_ativo`.
6. Visibilidade por secretaria principal; restrita como exceção → policy `solic_select`.
7. Prazo mínimo de 24h para solicitação externa → trigger `valida_24h` + validação na app.
8. Atraso é indicador calculado, nunca status → `estaAtrasada()` (nunca coluna/etapa).
9. Datas DD/MM/AAAA, 24h, fuso America/Sao_Paulo → `src/lib/dates.ts` (armazenamento UTC).
10. Chat só por grupos (sem conversas privadas), só links (sem upload) → tabelas de conversa sem storage.
11. Contas por convite (link único, 24h) → tabela `convites` + fluxo de auth.
12. Sem módulo financeiro, sem storage próprio de arquivos pesados, sem publicação automática → não implementados por regra.

## Determinações do adendo obrigatório (aplicadas)
- Protótipo é referência visual, **não** base arquitetural → app reconstruída em componentes/rotas/serviços.
- Removidos: seletor de ambientes, textos "Protótipo · demonstração", troca livre de portais, dados fixos, senhas demonstrativas, botões que só exibem toast, moldura de celular, simulações não persistentes.
- Login direciona ao ambiente do usuário (sem seletor público) → `middleware.ts`.
- Portal da Gráfica = página responsiva real (sem moldura de telefone), mobile-first.
- Menu mobile em **drawer** com overlay, foco, ESC e bloqueio de rolagem → `Sidebar.tsx`.
- Logo como **asset** otimizado (não Base64 no código).
- Fonte **Inter local** (sem CDN) → `globals.css` + `public/fonts`.
- Dados fixos → substituídos por leitura real do banco (ex.: Painel).
- Arrastar cartão validará no servidor (permissão/transição/aprovação) → previsto na Fase 3/15.
- Acessibilidade real (labels, aria, foco, teclado) → aplicada nos componentes base.
