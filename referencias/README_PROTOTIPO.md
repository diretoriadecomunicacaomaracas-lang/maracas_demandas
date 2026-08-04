# README — Protótipo navegável
## Sistema de Gestão de Demandas — Comunicação da Prefeitura de Maracás/BA
**Etapa 2 · alta fidelidade · dados fictícios · sem backend.**

---

## Como abrir

1. Abra o arquivo **`prototipo_maracas.html`** em um navegador moderno (Chrome, Edge ou Firefox), com duplo clique.
2. Não precisa de internet, servidor ou instalação. A fonte Inter é carregada da web quando há conexão; **offline**, o sistema usa uma fonte equivalente automaticamente. A **logomarca oficial** está embutida no próprio arquivo (extraída do PDF oficial, sem redesenho).
3. É um arquivo **único e autocontido** — pode ser copiado para qualquer pasta ou pendrive.

## Como navegar

- Na parte inferior da tela há uma **barra de demonstração** (apenas do protótipo) para alternar entre os quatro contextos: **Login**, **Ambiente interno**, **Portal do Solicitante** e **Portal da Gráfica**.
- No **Login**, o botão "Entrar" leva ao ambiente interno. Há links para Ativação, Recuperação e Convite expirado.
- No **ambiente interno**, use o **menu lateral** (Painel, Solicitações, Demandas, Criação, Audiovisual, Impressos, Calendário, Conversas, Arquivadas, Administração) e o botão ☰ para **recolher/expandir** o menu.
- Em **Demandas**, troque entre **Tabela, Kanban, Calendário, Lista, Atrasadas e Arquivadas** pelas abas de visualização.

## Telas disponíveis

**Acesso:** Login · Ativação de conta (criar senha) · Recuperação de senha · Convite expirado.
**Ambiente interno:** Painel principal (dashboard) · Central de Solicitações · Demandas em **Tabela** · Demandas em **Kanban** · Demandas em **Lista** · **Atrasadas** · **Arquivadas** · **Detalhe da demanda** (painel lateral com 10 abas) · **Calendário editorial** · **Conversas** (grupos) · **Administração** (Usuários, Convites pendentes, Cargos e permissões, Secretarias e unidades, Grupos operacionais, Grupos de conversa, Gráficas).
**Portal do Solicitante:** Minhas solicitações · **Nova solicitação** (assistente de 6 etapas) · Detalhe da solicitação.
**Portal da Gráfica (mobile-first):** Meus pedidos · Detalhe do pedido.

## Interações simuladas

- Abrir/recolher o menu lateral; trocar entre Tabela/Kanban/Calendário/Lista.
- Abrir uma demanda (painel lateral) e alternar suas abas (Resumo, Briefing, Responsáveis, Checklist, Links do Drive, Versões, Aprovações, Comentários, Histórico, Publicação/Impressão).
- **Arrastar cartões** no Kanban entre etapas (feedback + mensagem de registro).
- **Aprovar** material digital e depois **Liberar para publicação** (duas ações separadas).
- **Dupla aprovação** de impresso e a **ação única "Liberar para impressão"** (via modal), sem liberação automática.
- **Reabrir** demanda com justificativa (modal) e ver a regra de validade das aprovações.
- **Triagem** de solicitações; **criar usuário → enviar convite → "Aguardando ativação"**.
- **Nova solicitação** com a **regra de 24 horas**; **confirmar versão** e avançar produção no Portal da Gráfica.
- Notificações, perfil, calendário com evento clicável, conversas com menções e não lidas.

Todas as ações mostram um aviso "(simulado)" quando alteram apenas o estado visual.

## O que está simulado / limitações

- **Não** há backend, banco de dados, autenticação real, envio de e-mail, integração com Google Drive/Calendar, notificações reais, upload ou armazenamento de arquivos, APIs ou sistema de permissões funcional.
- Os **dados são fictícios** (demandas, solicitações, pedidos, usuários) e servem só para demonstrar a interface.
- **Nenhuma alteração persiste** após recarregar a página (estado em memória).
- Os **cargos/permissões** aparecem de forma ilustrativa (ex.: matriz na Administração); não há checagem funcional de acesso.
- A troca de ambiente é feita pela barra de demonstração; no sistema real, o direcionamento ocorre por cargo após o login.

## Conformidade com a base obrigatória

- **Especificação v2.2:** três ambientes isolados; aprovar × liberar (digital); dupla aprovação + liberação única (impresso); um link por versão; visibilidade por secretaria principal; atraso como indicador; datas DD/MM/AAAA e fuso America/Sao_Paulo; chat só por grupos; contas por convite. Nenhuma regra foi alterada.
- **Manual de Identidade + Logomarca:** marca oficial colorida embutida (sem redesenho), sobre fundos claros; área de proteção respeitada; menu recolhido usa ícone neutro (nunca o logo recortado); paleta e semântica de cores conforme o manual.
- **Referência Monday.com:** apenas estrutura/usabilidade (menu lateral, agrupamentos, abas de visualização, tabela, Kanban). Sem copiar identidade, cores, fundo escuro ou ícones proprietários — a interface é predominantemente clara e mais simples.

## Arquivos desta etapa

- `prototipo_maracas.html` — protótipo navegável (este README explica o uso).
- `logo_maracas.png` — logomarca oficial extraída do PDF (asset).
- `01_direcao_visual.md` · `02_design_system.md` · `03_arquitetura_de_telas.md` · `04_fluxos_do_prototipo.md`
- `PENDENCIAS_VISUAIS.md` — pendências e ativos ainda necessários.

## Observação importante

Nenhum sistema definitivo foi programado. Este é um **protótipo visual navegável** para validar a direção visual e a experiência antes do desenvolvimento. Estrutura estática/local, sem tratar a tecnologia usada como definitiva.
