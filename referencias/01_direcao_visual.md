# 01 — Direção Visual
## Sistema de Gestão de Demandas — Comunicação da Prefeitura de Maracás/BA
**Etapa 2 — Direção visual, Design System e protótipo navegável.** Base obrigatória: Especificação v2.2 (regras de negócio), Manual de Identidade Visual e Logomarca oficial colorida. Referência de estrutura/usabilidade: captura do Monday.com (sem copiar identidade).

---

## 1. Entendimento da identidade

A marca da Prefeitura de Maracás é **colorida, cultural e expressiva**: o nome "MARACÁS" usa a fonte Gotham Ultra com cantos suavemente arredondados, e a letra "A" recebe elementos gráficos culturais (flechas cruzadas, flor e maracás). O slogan "CUIDANDO DO NOSSO POVO, CONSTRUINDO O FUTURO!" e o descritor "PREFEITURA DE" usam Neulis Cursive Light. A sequência de cores da palavra (azul → ciano → verde → amarelo → laranja → laranja-avermelhado → vermelho) é fixa e não pode ser alterada.

A marca é vibrante; portanto, a **interface deve ser sóbria** para não competir com ela. A estratégia é uma base branca e neutra, com as cores institucionais aplicadas de forma pontual (status, navegação, indicadores). Assim a marca brilha onde aparece (login, portais, cabeçalhos) e o produto permanece limpo, legível e institucional.

## 2. Conceito visual central

> "Uma plataforma moderna e institucional, inspirada na organização e na facilidade de uso do Monday.com, com base branca, cinzas suaves, linhas finas, componentes limpos, navegação intuitiva e uso estratégico das cores oficiais da Prefeitura de Maracás."

Palavras que o sistema transmite: organização, modernidade, clareza, confiança, leveza, institucionalidade, eficiência, facilidade de uso, colaboração e profissionalismo. O sistema deve ser **mais leve e simples que o Monday.com**.

## 3. Princípios de direção visual

1. **Base clara sempre.** Fundo branco ou cinza muito claro (#F7F8FA / #F8F9FB); superfícies de conteúdo brancas. Nada de grandes áreas escuras.
2. **Cor com moderação e propósito.** As cores da marca aparecem em status, item ativo, botões primários e indicadores — nunca preenchendo células inteiras nem "pintando" tudo.
3. **Etiquetas de status suaves.** Fundo pastel + texto escuro + ponto/ícone. Nunca uma célula inteira saturada.
4. **Linhas finas e respiro.** Bordas de 1px em cinza-claro, cantos de 8–12px, sombras discretas, espaçamentos generosos.
5. **Hierarquia clara.** Título → ações → filtros → conteúdo. Um único botão primário por contexto.
6. **Acessibilidade primeiro.** Nenhuma informação apenas por cor; contraste adequado; texto escuro sobre fundos claros.
7. **Consistência entre ambientes,** com diferenças de "assinatura" que deixam claro onde o usuário está (interno × Portal do Solicitante × Portal da Gráfica).
8. **A marca é intocável.** Usada a partir do arquivo oficial, com área de proteção respeitada; nunca redesenhada, recortada ou distorcida.

## 4. Aplicação da marca (resumo — detalhes no Design System)

- **Arquivo oficial colorido** é a fonte única da marca no protótipo (`logo_maracas.png`, extraído do PDF oficial, sem redesenho).
- Uso **preferencial sobre fundo branco/claro**. Sobre fundos coloridos ou com interferência, a marca vai dentro de um **box branco** com cantos arredondados (conforme o manual).
- **Área de proteção** = altura da letra "M" de Maracás. Nenhum elemento encosta na marca; respiro em todos os lados.
- **Proibido:** remover elementos culturais, alterar ordem/tons das cores, distorcer, inclinar, esticar, comprimir, aplicar sombra, recortar ou substituir por fonte comum.
- **Menu lateral recolhido:** não se recorta o logotipo para virar ícone. Usa-se um **ícone neutro do sistema** até existir símbolo compacto oficial.
- **Versão negativa/monocromática:** existe no manual, mas **não foi fornecida como arquivo**. Onde for necessária (ex.: eventual cabeçalho escuro), usa-se provisoriamente um **placeholder reservado** ou o box branco com a marca colorida (ver PENDENCIAS_VISUAIS.md).

Aparições principais da marca: tela de **login**, **ativação de conta**, cabeçalho do **Portal do Solicitante**, cabeçalho do **Portal da Gráfica**, topo do **menu lateral interno** e telas institucionais.

## 5. Decisões visuais

- **Tipografia da interface:** Inter (sans-serif moderna, ótima legibilidade em tabelas, formulários, datas e mobile). Gotham Ultra e Neulis Cursive Light ficam restritas à marca e não são usadas em textos de UI.
- **Cor primária de produto:** Azul #028EFF (navegação, item ativo, botões principais, links).
- **Semântica de status** mapeada às cores da marca (verde=sucesso, amarelo=planejamento/atenção, laranja=produção, laranja-avermelhado=aguardando ação, vermelho=atraso/crítico, azul-claro=informação).
- **Densidade confortável** (não apertada): linhas de tabela com boa altura, cartões de Kanban com respiro.
- **Faixa de etapa** nos cartões e grupos (fina, lateral/superior) em vez de blocos coloridos.
- **Data atual em azul** no calendário; eventos com fundos **pastel** por tipo.
- **Assinatura por ambiente:** interno = menu lateral branco + faixa azul no item ativo; Portal do Solicitante = cabeçalho branco com a marca + acento azul, layout enxuto; Portal da Gráfica = mobile-first, cabeçalho com marca em box branco, foco em um pedido por vez.
- **Textura institucional** apenas em login/estados vazios/cabeçalhos institucionais, com opacidade 2–4%; nunca dentro de tabelas, formulários, cartões ou calendário.

## 6. O que evitar (guarda-corpos)

Excesso de elementos, cores fortes ou ícones; telas congestionadas; tabelas apertadas; menus confusos; grandes áreas escuras; aparência burocrática ou infantil; células saturadas; excesso de sombras/bordas; e qualquer cópia da identidade, fundo azul-marinho, ícones proprietários ou barra superior congestionada do Monday.com.

## 7. Relação com a especificação v2.2

Toda a direção visual serve às regras da v2.2 sem alterá-las: separação dos três ambientes; aprovação por Diretor/Coordenador; **duas ações separadas** (Aprovar × Liberar publicação) no digital; **dupla aprovação + ação única "Liberar para impressão"** no impresso; um **link próprio por versão** no Drive; visibilidade por **secretaria principal**; "atrasado" como **indicador** (nunca coluna); calendário com data/hora no fuso **America/Sao_Paulo** e datas **DD/MM/AAAA**; chat por **grupos** (sem conversas diretas nesta etapa); criação de contas por **convite de e-mail**. Conflitos eventuais são registrados em `PENDENCIAS_VISUAIS.md`, sem mudar a regra.
