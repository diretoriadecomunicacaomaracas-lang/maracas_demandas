# PENDÊNCIAS VISUAIS
## Sistema de Gestão de Demandas — Comunicação da Prefeitura de Maracás/BA

Somente questões realmente não resolvidas, ativos adicionais necessários e observações para o desenvolvimento futuro. Nenhuma regra da Especificação v2.2 foi alterada.

---

## 1. Ativos de marca ainda necessários

1. **Versão negativa/monocromática da marca (arquivo).** O Manual mostra que existem versões negativa (para fundos escuros) e monocromática, mas apenas a **versão colorida** foi fornecida como arquivo. Enquanto o arquivo oficial não for entregue, o protótipo prioriza fundos claros e, quando precisa da marca sobre cor, usa um **box branco** com a marca colorida (conforme o manual). Onde uma negativa seria ideal, há um **placeholder reservado**. → Fornecer o arquivo oficial da versão negativa/monocromática.
2. **Símbolo compacto oficial (ícone da marca).** Não existe um símbolo autorizado para espaços pequenos (ex.: menu recolhido, favicon, avatar do app). O protótipo usa um **ícone neutro do sistema** nesses locais, sem recortar o logotipo. → Definir/fornecer um símbolo compacto oficial, se desejado.
3. **Logo em vetor (SVG/PDF de alta resolução).** O protótipo embute um PNG extraído do PDF oficial (sem redesenho). Para produção, o ideal é o **vetor** para nitidez em qualquer tamanho. → Fornecer o SVG/EPS oficial.
4. **Fontes da marca licenciadas.** Gotham Ultra e Neulis Cursive Light pertencem à marca e não são usadas na UI (que usa Inter). Se algum material institucional dentro do sistema precisar delas, será necessária a **licença**. → Confirmar disponibilidade/licença, se aplicável.

## 2. Observações de contraste/acessibilidade

5. **Botão primário azul (#028EFF) com texto branco** fica adequado para texto grande/negrito (14px+), padrão dos botões. Para textos pequenos sobre azul, o protótipo evita e usa texto escuro ou aumenta o peso. → Validar na etapa de QA de acessibilidade (meta WCAG AA).
6. **Amarelo #FFC605 e verde-limão #8EEA00** só recebem **texto escuro** (nunca branco). Isso já está aplicado nas etiquetas. → Manter na implementação.
7. **Daltonismo:** status sempre com nome (+ ícone quando útil), não só cor. → Manter; considerar teste com simuladores.

## 3. Itens que dependem de definição de conteúdo (não bloqueiam)

8. **Ícones definitivos.** O protótipo usa ícones lineares genéricos. → Escolher o conjunto final (sugestão: Lucide/Feather) na implementação.
9. **Textos institucionais** (boas-vindas do login, mensagens de e-mail de convite/recuperação) são fictícios no protótipo. → Redigir os textos oficiais.
10. **Fotos/avatars reais** dos membros: o protótipo usa iniciais/ilustrações. → Definir política de foto de perfil.
11. **Textura institucional:** aplicada como padrão sutil (2–4%). → Se a Prefeitura tiver uma textura/padrão oficial, substituir a genérica.

## 4. Pontos de produto herdados da v2.2 (apenas lembretes visuais)

12. **Versão negativa em telas escuras:** como a v2.2 e a direção visual priorizam fundos claros, não há tela escura no protótipo. Caso, no futuro, se deseje um modo escuro, será preciso: a marca negativa (item 1) e uma revisão de contraste da paleta.
13. **Pesquisa no chat e conversas diretas:** a v2.2 define pesquisa básica no MVP e conversas diretas para depois. O protótipo mostra apenas grupos (sem conversas privadas), coerente com a decisão.

## 5. Conflitos funcionais identificados

Nenhum conflito com as regras da v2.2 foi encontrado ao traduzir a especificação em telas. Caso algum surja na implementação, deve ser registrado aqui **sem** alterar a regra original, para decisão do cliente.

## 6. Recomendações para a próxima etapa (desenvolvimento)

- Converter os tokens deste Design System em **variáveis de tema** (CSS/Design Tokens) reutilizáveis.
- Transformar os componentes do protótipo em uma **biblioteca de componentes** (botões, campos, etiquetas, tabela, Kanban, drawer).
- Validar acessibilidade (AA) com ferramentas automatizadas + testes manuais.
- Obter os ativos de marca em vetor e a versão negativa antes de telas que exijam fundo escuro.
