# 03 — Arquitetura de telas
## Sistema de Gestão de Demandas — Comunicação da Prefeitura de Maracás/BA

Mapa de telas, navegação e estrutura de cada ambiente. Alinhado ao mapa de navegação da Especificação v2.2 e à referência de organização do Monday.com.

---

## 1. Três ambientes isolados

| Ambiente | Público | Assinatura visual |
|---|---|---|
| **Interno** | Equipe de Comunicação (Admin, Diretor, Coordenador, Designer, Videomaker, Social Media, Jornalista/Redator, Visualizador) | Menu lateral branco; faixa azul no item ativo; densidade de produtividade |
| **Portal do Solicitante** | Secretarias/unidades | Cabeçalho branco com a marca; layout enxuto; foco em solicitar e acompanhar |
| **Portal da Gráfica** | Fornecedores de impressão | Mobile-first; marca em box branco; um pedido por vez |

Cada usuário é direcionado ao seu ambiente conforme o cargo (v2.2). Acúmulo de cargos → ambiente interno mais completo.

## 2. Mapa de telas (protótipo)

```
LOGIN / ACESSO
 ├─ Login
 ├─ Ativação de conta (criar senha)
 ├─ Recuperação de senha
 └─ Convite expirado

AMBIENTE INTERNO
 ├─ Painel principal (dashboard)
 ├─ Solicitações (Central de Solicitações)
 ├─ Demandas
 │   ├─ Tabela  ├─ Kanban  ├─ Calendário  ├─ Lista  ├─ Atrasadas  └─ Arquivadas
 │   └─ Detalhe da demanda (drawer/página): Resumo · Briefing · Responsáveis e membros ·
 │        Checklist · Links (Drive) · Versões · Aprovações · Comentários · Histórico · Publicação/Impressão
 ├─ Criação · Audiovisual · Impressos (recortes por tipo, mesmas visualizações)
 ├─ Calendário editorial
 ├─ Conversas (grupos)
 ├─ Arquivadas
 └─ Administração
      ├─ Usuários  ├─ Convites pendentes  ├─ Cargos e permissões
      ├─ Secretarias (principais e unidades)  ├─ Grupos operacionais
      ├─ Grupos de conversa  └─ Gráficas

PORTAL DO SOLICITANTE
 ├─ Início / Minhas solicitações (da secretaria)
 ├─ Nova solicitação (assistente em 6 etapas)
 └─ Detalhe da solicitação (status resumido, mensagens, resultado)

PORTAL DA GRÁFICA
 ├─ Meus pedidos
 └─ Detalhe do pedido (ficha técnica, versão vigente, confirmação, produção, entrega)
```

## 3. Estrutura do ambiente interno

**Barra superior** (branca, linha inferior 1px): logo/menu recolher · **pesquisa global** · notificações (badge) · conversas (badge) · ajuda · avatar com nome e cargo · configurações pessoais.

**Menu lateral** (248px / recolhido 64px): Painel · Solicitações · Demandas · Criação · Audiovisual · Impressos · Calendário · Conversas · Arquivadas · Administração (conforme permissão). Item ativo: fundo azul 8%, texto/ícone azul, faixa lateral azul 3px. Recolhido: apenas ícones + ícone neutro no topo (nunca o logo recortado).

**Área de conteúdo:** título da página · descrição curta (quando útil) · botão de ação principal ("Criar elemento") · **abas de visualização** (Tabela/Kanban/Calendário/Lista/Atrasadas/Arquivadas) · barra de ferramentas (pesquisa, filtro, ordenar, ocultar, agrupar por) · conteúdo.

### 3.1 Painel principal (dashboard)
Cartões de indicadores (novas solicitações, em andamento, **atrasadas**, aguardando aprovação, publicações de hoje, aguardando impressão, em produção gráfica, entregas próximas) · publicações de hoje e próximos 7 dias (lista/calendário compacto) · resumo por responsável e por secretaria · andamento das campanhas (barras de progresso) · atalhos para itens críticos. Poucos gráficos; foco em listas e cartões.

### 3.2 Demandas — visualizações
Mesmo conjunto de dados em: **Tabela** (agrupada por etapa), **Kanban** (colunas = etapas do fluxo), **Calendário**, **Lista**, **Atrasadas** (filtro por indicador de atraso), **Arquivadas**. Seletor de visualização estilo segmented control, troca fácil (referência Monday).

**Colunas de tabela** (configuráveis): seleção · Elemento/título · Tipo · Responsável · Membros · Status · Prazo · Data/horário de publicação · Prioridade · Secretaria · Solicitado por · Versão atual · Aprovação · Comentários · Links · Última atualização. Agrupamentos: Planejamento, Em produção, Revisão, Aguardando aprovação, Aprovado, Aguardando publicação, Publicado, Finalizado.

**Kanban:** cartões brancos com faixa da etapa; colunas seguem os fluxos da v2.2 (digital, audiovisual, impresso). "Em atraso" é indicador no cartão, nunca coluna.

### 3.3 Detalhe da demanda
Drawer lateral amplo (ou página). Cabeçalho: título, status, prioridade, prazo, secretaria, responsável, **indicador de atraso**, **versão vigente**, aprovação necessária. Abas: Resumo · Briefing · Responsáveis e membros · Checklist · Links do Google Drive · **Versões** · **Aprovações** · Comentários · Histórico · Publicação/Impressão. Regras visíveis: um link por versão; aprovar × liberar (digital); dupla aprovação + liberação única (impresso).

### 3.4 Administração
Listas com busca e filtros: Usuários (situação: ativa/aguardando ativação/inativa) · Convites pendentes (reenviar) · Cargos e permissões (matriz) · Secretarias e unidades subordinadas · Grupos operacionais · Grupos de conversa · Gráficas. Fluxo visual de criação de usuário (6 passos) até "Aguardando ativação".

## 4. Portal do Solicitante
Cabeçalho branco com a marca oficial + acento azul. Tela inicial com **"Nova solicitação"** em destaque e a lista das solicitações **da secretaria** (visibilidade por secretaria principal). Cada item: protocolo, título, data, prazo, **status resumido**. Detalhe: dados enviados, mensagens com a Comunicação, pedido de informações, resultado final, eventual link de publicação/entrega. **Nova solicitação** em assistente de 6 etapas: 1) Dados básicos; 2) Tipo de material; 3) Informações e briefing; 4) Data e prazo (com a **regra de 24h**); 5) Links e referências; 6) Revisão e envio. Não exibe Kanban, calendário interno, responsáveis/comentários internos, versões de trabalho ou grupos.

## 5. Portal da Gráfica
Mobile-first. Cabeçalho com marca em box branco. **Meus pedidos** (apenas os atribuídos). Detalhe do pedido: ficha técnica (quantidade, medidas, formato, material, acabamento), prazo, local de entrega, **link da versão vigente liberada**, termo de **confirmação da versão**, status da produção e registro de entrega. Ações simuladas: Confirmar recebimento · Confirmar versão · Pedido confirmado · Em produção · Pronto · Em transporte · Entregue · Informar problema · Adicionar link de foto · Adicionar link de comprovante. Não vê orçamento, quadro geral, calendário, grupos internos, rascunhos, versões substituídas nem comentários internos.

## 6. Conversas internas
Layout três colunas (desktop): lista de **grupos** à esquerda (Geral, Coordenação, Criação, Audiovisual, Social Media e Publicações, Jornalismo e Coberturas, Impressos) · mensagens ao centro (texto, links do Drive, respostas, menções, não lidas) · painel de informações do grupo à direita (opcional). Sem conversas privadas nesta etapa; sem upload de arquivos (apenas links). No mobile, uma coluna por vez.

## 7. Login e acesso
Fundo claro com textura institucional 2–4%; marca oficial colorida centralizada; formulário simples (e-mail, senha, "Esqueci minha senha", botão azul); mensagem de boas-vindas. Telas relacionadas: ativação de conta (criar senha, com regra de senha), recuperação, convite expirado (reenviar).

## 8. Navegação e transições
Troca de visualização sem recarregar contexto; abrir demanda em drawer preservando o quadro; menu recolhível; abas internas na demanda; filtros em popover; feedback ao arrastar cartões no Kanban; modais para ações críticas (cancelar, reabrir com justificativa, liberar impressão, enviar convite). Todas as interações são simuladas (dados fictícios).

## 9. Responsividade por tela
- **Desktop (principal):** ambiente interno, tabela, Kanban, dashboard, calendário, administração.
- **Tablet:** menu recolhido, tabelas com rolagem, drawer de detalhes maior.
- **Celular:** Portal do Solicitante, Portal da Gráfica, notificações, calendário em lista, conversas, consulta rápida de demandas. O protótipo inclui telas-chave em mobile.
