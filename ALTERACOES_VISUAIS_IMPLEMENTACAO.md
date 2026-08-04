# ALTERAÇÕES VISUAIS NA IMPLEMENTAÇÃO

Registro das mudanças visuais em relação ao protótipo aprovado. Regra: só mudar por responsividade, acessibilidade, correção, funcionamento real ou consistência — nunca por preferência. O protótipo original permanece intocado em `referencias/prototipo-aprovado/`.

## Mudanças aplicadas (necessárias)
1. **Remoção de elementos de demonstração** (determinação do adendo): barra inferior de troca de ambientes, textos "Protótipo · demonstração", troca livre entre portais, botões que só exibiam toast, moldura de celular do Portal da Gráfica, dados fixos e senhas demonstrativas. Motivo: funcionamento real e segurança.
2. **Roteamento por login** em vez do seletor público de ambiente. Motivo: cada usuário acessa só o seu ambiente (segurança/v2.2).
3. **Portal da Gráfica** passa a ser página responsiva real (sem moldura de telefone), mobile-first e usável no desktop. Motivo: adendo item 6.
4. **Menu mobile em drawer** com overlay, foco, ESC e bloqueio de rolagem. Motivo: adendo item 7 (o protótipo apenas ocultava o menu).
5. **Logo como asset** (`public/brand/logo-maracas.png`) em vez de Base64 no código. Motivo: adendo item 8. Marca preservada rigorosamente.
6. **Fonte Inter local** (`public/fonts`) em vez de CDN Google Fonts. Motivo: adendo item 9 (sem dependência remota).
7. **Acessibilidade real** adicionada: `label`/`aria-label`, foco visível, papéis (`role="status"/"alert"/"navigation"`), texto alternativo da marca, `sr-only`. Motivo: adendo item 13.

## Preservado sem alteração
Cores, tipografia (Inter), espaçamentos, estilo de botões, etiquetas de status (pastel + ponto), tabela, Kanban (faixa de etapa), calendário, painéis, cartões, aplicação da marca sobre fundo claro e a organização geral (menu lateral, barra superior, abas de visualização).

## Pendências visuais herdadas
Ver `referencias/PENDENCIAS_VISUAIS.md`: versão negativa/monocromática e símbolo compacto oficiais, logo em vetor (SVG), conjunto de ícones definitivo.
