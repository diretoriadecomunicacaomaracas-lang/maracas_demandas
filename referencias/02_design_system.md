# 02 — Design System inicial
## Sistema de Gestão de Demandas — Comunicação da Prefeitura de Maracás/BA

Design System de referência para o protótipo e para o desenvolvimento futuro. Todos os tokens abaixo estão aplicados no protótipo (`prototipo_maracas.html`) via CSS custom properties.

---

## 1. Princípios de interface

Clareza acima de tudo; base neutra com cor pontual; hierarquia evidente; densidade confortável; consistência entre ambientes; acessibilidade (nada só por cor, contraste adequado); e leveza (linhas finas, sombras discretas, respiro).

## 2. Paleta oficial da marca (Manual de Identidade)

**Primárias**

| Nome | HEX | RGB |
|---|---|---|
| Azul principal | `#028EFF` | 2, 142, 255 |
| Azul-claro / ciano | `#0EC7FF` | 14, 199, 255 |
| Verde-limão | `#8EEA00` | 142, 234, 0 |
| Amarelo | `#FFC605` | 255, 198, 5 |
| Laranja | `#FF9E22` | 255, 158, 34 |
| Laranja-avermelhado | `#FF6729` | 255, 103, 41 |
| Vermelho | `#FF3B2B` | 255, 59, 43 |

**Secundárias**

| Nome | HEX |
|---|---|
| Azul secundário | `#08ABFF` |
| Verde secundário | `#4ED980` |
| Verde-amarelado | `#C7D803` |
| Amarelo-alaranjado | `#FFB214` |
| Laranja secundário | `#FF8326` |
| Vermelho-alaranjado | `#FF512A` |

## 3. Paleta funcional (semântica)

A interface **não** usa todas as cores com a mesma intensidade. Base neutra + cor institucional em pontos estratégicos.

| Uso | Cor | HEX |
|---|---|---|
| Navegação, links, botão primário, item ativo | Azul | `#028EFF` |
| Destaque secundário / informação | Azul-claro | `#0EC7FF` |
| Concluído, aprovado, publicado, entregue, sucesso | Verde | `#4ED980` |
| Planejamento, atenção, prazo próximo | Amarelo | `#FFC605` |
| Em produção, criação, gravação, edição | Laranja | `#FF9E22` |
| Aguardando aprovação / ação necessária | Laranja-avermelhado | `#FF6729` |
| Atraso, erro, cancelamento, reprovação, crítico | Vermelho | `#FF3B2B` |

Cada cor semântica tem uma variante **pastel** (fundo de etiqueta) e uma **escura** (texto/ícone), usadas juntas para garantir contraste. Ex.: aprovado → fundo `#E6F8EE`, texto `#1B7F4B`.

## 4. Escala de cinzas (neutros)

| Token | Uso | HEX |
|---|---|---|
| `--bg` | Fundo geral | `#F7F8FA` |
| `--surface` | Superfícies / cartões / tabela | `#FFFFFF` |
| `--surface-2` | Cabeçalho de tabela, hover suave | `#F2F4F7` |
| `--border` | Divisórias, bordas 1px | `#E6E9EF` |
| `--text` | Texto principal | `#1F2430` |
| `--text-2` | Texto secundário | `#5B6472` |
| `--text-3` | Texto terciário / placeholder | `#98A1B0` |
| `--disabled` | Campos desabilitados | `#EEF1F5` |

## 5. Tipografia

- **Família de UI:** Inter (fallback: system-ui, Segoe UI, Roboto, Arial).
- **Marca:** Gotham Ultra / Neulis Cursive Light — apenas no arquivo oficial, nunca reproduzidas na UI.

**Hierarquia**

| Estilo | Tamanho / peso | Uso |
|---|---|---|
| Título de página (H1) | 22px / 700 | Nome da tela |
| Seção (H2) | 18px / 600 | Blocos, abas ativas |
| Subtítulo (H3) | 15px / 600 | Cartões, grupos |
| Corpo | 14px / 400 | Texto geral, tabelas |
| Apoio | 13px / 400 | Metadados, datas |
| Legenda | 12px / 500 | Etiquetas, chips |
| Micro | 11px / 600 (maiúsculas, +espaçamento) | Cabeçalhos de coluna, grupos |

Altura de linha 1.45 no corpo; números tabulares em datas/horários.

## 6. Espaçamento, raios e sombras

- **Escala de espaçamento (4px base):** 4, 8, 12, 16, 20, 24, 32, 40.
- **Raios:** botões/campos/cartões 10px; chips/etiquetas 999px (pílula); modais 14px.
- **Bordas:** 1px `--border`. Foco: contorno 2px azul `#028EFF` com leve halo.
- **Sombras:** `--shadow-sm` 0 1px 2px rgba(16,24,40,.06); `--shadow-md` 0 6px 20px rgba(16,24,40,.08). Uso discreto (cartões flutuantes, painéis, modais).

## 7. Componentes

**Botões** — altura 40px (compacto 32px), raio 10px, peso 600.
- *Primário:* fundo azul `#028EFF`, texto branco. Hover levemente mais escuro.
- *Secundário:* fundo branco, borda 1px, texto `--text`.
- *Sutil/ghost:* sem borda, texto azul; hover fundo azul 6%.
- *Perigo:* texto/again borda vermelho para cancelar/reprovar (com confirmação).
- Estados: hover, foco (anel azul), ativo, desabilitado (`--disabled`, texto `--text-3`).

**Campos** — altura 40px, borda 1px, raio 10px, label 13px acima, placeholder `--text-3`, ajuda/erro 12px (erro em vermelho com ícone). Estados: normal, foco (anel azul), erro, desabilitado.

**Seletores** — dropdown, multiselect (chips), toggle, checkbox, radio, seletor de data/hora (DD/MM/AAAA + 24h), seletor de visualização (segmented control).

**Tabelas** — cabeçalho `--surface-2`, texto micro; linhas brancas com divisória 1px; altura de linha confortável (48px); hover linha `--surface-2`; coluna de seleção; agrupamento por etapa com faixa lateral colorida no cabeçalho do grupo; rolagem horizontal só quando necessário; ícones pequenos para comentários/links; avatares (foto ou iniciais).

**Cartões (Kanban)** — fundo branco, borda 1px, raio 12px, sombra sm; **faixa superior/lateral fina** com a cor da etapa; conteúdo: título, chips (tipo, secretaria), avatar, prazo, prioridade, indicadores (atraso, comentários, links, versão, aprovação pendente). Nunca preencher o cartão inteiro de cor.

**Etiquetas de status** — pílula com fundo pastel + ponto/ícone + texto escuro. Sempre nome + cor (+ ícone quando necessário). Exemplos no item 9.

**Chips** — tipo (Digital/Audiovisual/Impresso), secretaria, prioridade. Neutros por padrão; prioridade "Emergencial" em vermelho suave.

**Alertas / banners** — informação (azul-claro), sucesso (verde), atenção (amarelo), erro/crítico (vermelho). Ícone + título + texto + ação opcional; fundo pastel, borda 1px.

**Modais** — largura 420–640px, cabeçalho com título e fechar, corpo, rodapé com ações (primária à direita). Overlay rgba(16,24,40,.45). Uso: confirmar cancelamento, reabrir demanda (com justificativa), liberar impressão, enviar convite.

**Painel lateral (drawer) de detalhes** — largura ~520px (desktop), desliza da direita, mantém o quadro visível ao fundo; cabeçalho com título/status/ações; abas internas. Alternativa: página própria da demanda.

**Menus** — menu lateral (expandido/recolhido), menu de contexto (⋯), abas, dropdowns. Item ativo do menu: fundo azul 8%, texto/ícone azul, faixa lateral azul de 3px.

**Avatares** — círculo 28–32px; foto ou iniciais sobre cor derivada do nome; grupos mostram pilha com "+N".

**Indicadores** — ponto de atraso (vermelho) com dias; badge de comentários/links; badge de "aprovação pendente"; barra de progresso (campanhas); contadores de não lidas (conversas/notificações).

**Estados vazios** — ilustração leve/ícone + título + texto curto + ação. Textura institucional 2–4% permitida no fundo.

**Estados de carregamento** — skeletons (blocos cinza com shimmer) em tabelas e cartões; spinner sutil em ações.

**Estados de erro** — banner de erro; erro de campo inline; página de erro amigável; convite expirado (tela dedicada com reenviar).

## 8. Ícones

Estilo **linear** (contorno), 1.5–2px, tamanho 18–20px na UI. Conjunto sugerido para o dev: Lucide/Feather (open-source, coerentes com o traço). No protótipo, ícones inline (SVG/emoji neutro) apenas para demonstração. **Não** usar ícones proprietários do Monday.com.

## 9. Etiquetas de status (mapa completo)

Cada status = nome + cor + (ícone) + contraste. Fundo pastel, texto escuro.

| Status | Cor semântica |
|---|---|
| Planejamento | Amarelo |
| Em criação / Em produção / Em gravação / Em edição / Roteiro | Laranja |
| Revisão interna | Azul-claro |
| Aguardando aprovação / Aguardando aprovação do Coordenador / do Diretor / Ação necessária | Laranja-avermelhado |
| Correção solicitada / Reprovado | Vermelho |
| Aprovado / Aprovado pelos dois | Verde |
| Aguardando publicação / Aguardando confirmação da gráfica / Aguardando distribuição | Amarelo |
| Publicado / Entregue / Conferido / Concluído / Finalizado / Liberado | Verde |
| Em produção gráfica / Em transporte / Pedido confirmado | Laranja |
| Parado / Pausado | Cinza (neutro) |
| Cancelado | Cinza-vermelho (neutro com ícone) |
| **Em atraso** (indicador, não status) | Vermelho — sempre acompanha o status real (ex.: "Em criação • Em atraso 3 d") |

Status resumidos do **Portal do Solicitante** (v2.2): Enviada, Em análise, Aguardando informações, Aprovada — em planejamento, Em produção, Em revisão, Em finalização, Concluída, Pausada, Recusada, Cancelada.

## 10. Acessibilidade das cores

- Nenhuma informação só por cor: status têm nome e, quando útil, ícone.
- Contraste: texto principal `--text` (#1F2430) sobre branco ≈ 13:1. Etiquetas usam texto escuro sobre pastel (≥ 4.5:1).
- **Proibido** texto branco pequeno sobre amarelo, verde-limão ou laranja-claro — nesses fundos, texto escuro.
- Botão primário azul `#028EFF` com texto branco: contraste ≈ 3.3:1 para texto grande/negrito 14px+ (aceitável para botão); ícones e foco reforçam.
- Foco sempre visível (anel azul 2px). Alvos de toque ≥ 40px no mobile.

## 11. Aplicação da marca (regras aplicadas)

- Fonte única: arquivo oficial colorido (`logo_maracas.png`).
- Fundo branco/claro preferencial; sobre cor, **box branco** arredondado com respiro.
- Área de proteção = altura do "M"; nenhum elemento encosta.
- Nunca redesenhar, recortar, distorcer, inclinar, esticar, comprimir, sombrear ou trocar tons.
- Menu recolhido: **ícone neutro**, nunca o logo recortado.
- Tamanho mínimo que mantenha o slogan legível; abaixo disso, usar a marca sem exigir leitura do slogan (nunca comprimir).

## 12. Grid e layout

- **Desktop:** menu lateral 248px (recolhido 64px) + área de conteúdo fluida; largura de leitura confortável; padding de conteúdo 24px.
- **Tablet:** menu recolhível por padrão; tabelas com rolagem horizontal; drawer de detalhes em largura maior.
- **Celular:** navegação inferior/telescópica; tabelas viram listas/cartões; calendário em lista; foco em um item por vez (essencial para Portais do Solicitante e da Gráfica).
