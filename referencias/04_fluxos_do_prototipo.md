# 04 — Fluxos do protótipo
## Sistema de Gestão de Demandas — Comunicação da Prefeitura de Maracás/BA

Fluxos demonstrados, interações simuladas e estados. Todos os dados são fictícios; nada é persistido, enviado ou integrado.

---

## 1. Fluxos representados (etapas visuais)

**Digital** — Planejamento → Aguardando distribuição → Em criação → Revisão interna → Aguardando aprovação → Correção solicitada → Aprovado → Aguardando publicação → Publicado → Finalizado.

**Audiovisual** — Planejamento → Roteiro → Aguardando gravação → Em gravação → Aguardando edição → Em edição → Revisão → Aguardando aprovação → Correção → Aprovado → Aguardando publicação → Publicado → Finalizado.

**Impressos** — Planejamento → Em criação → Revisão → Aguardando aprovação do Coordenador → Aguardando aprovação do Diretor → Aprovado pelos dois → Liberado para impressão → Aguardando confirmação da gráfica → Pedido confirmado → Em produção gráfica → Pronto → Em transporte → Entregue → Conferido → Finalizado.

Em todos, **"Em atraso"** aparece como indicador sobre o status real, nunca como coluna/etapa.

## 2. Interações simuladas (demonstráveis no protótipo)

1. **Abrir/recolher o menu lateral.**
2. **Trocar entre Tabela, Kanban e Calendário** (e Lista/Atrasadas/Arquivadas).
3. **Abrir uma demanda** em painel lateral e **alternar suas abas**.
4. **Abrir filtros** e busca.
5. **Simular movimentação de cartão** no Kanban (mudança de etapa com feedback visual).
6. **Enviar demanda para aprovação** (muda status e registra no histórico simulado).
7. **Aprovar material digital** — demonstra as **duas ações separadas**: "Aprovar" (valida) e depois "Liberar para publicação".
8. **Dupla aprovação de impresso** — Coordenador aprova a versão → Diretor aprova a **mesma** versão → só então surge **uma única ação "Liberar para impressão"** (não automática).
9. **Liberar para impressão** e ver o pedido ir para **"Aguardando confirmação da gráfica"**.
10. **Confirmar versão na gráfica** (termo) e avançar a produção.
11. **Substituir versão** — demonstra invalidação das aprovações e retorno para nova confirmação.
12. **Abrir o calendário** e clicar em um evento para abrir a demanda.
13. **Abrir uma conversa de grupo**, ver menções e não lidas.
14. **Preencher nova solicitação** (assistente de 6 etapas) com a **regra de 24h**.
15. **Consultar um pedido gráfico** no Portal da Gráfica.
16. **Visualizar uma notificação** e **abrir o perfil**.
17. **Criar usuário → enviar convite → "Aguardando ativação"** (sem envio real).
18. **Reabrir demanda** com justificativa (modal) — demonstra a regra de validade das aprovações.

## 3. Regras da v2.2 tornadas visíveis

- **Aprovar × Liberar (digital):** botões distintos; um card pode ficar "Aprovado" aguardando data para "Liberar para publicação". Basta Diretor **ou** Coordenador em cada etapa.
- **Impressos:** duas aprovações na **mesma versão**; ação única "Liberar para impressão" (Diretor **ou** Coordenador); sem liberação automática; gráfica confirma a versão; versão substituída exige nova aprovação e confirmação.
- **Um link por versão:** cada versão exibe seu próprio link do Drive; a UI alerta se um link se repetir entre versões.
- **Visibilidade por secretaria principal:** Portal do Solicitante lista as solicitações da secretaria (não só as próprias); restrita é exceção.
- **Atraso é indicador:** chip vermelho "Em atraso Xd" junto ao status.
- **Fuso/idioma:** datas DD/MM/AAAA, horário 24h, America/Sao_Paulo.
- **Chat:** apenas grupos (sem conversas privadas nesta etapa); somente links do Drive (sem upload).
- **Contas por convite:** criação → convite → "Aguardando ativação" → criar senha (política de senha exibida).

## 4. Estados demonstrados

- **Vazio:** listas sem itens (ex.: nenhuma solicitação, nenhuma conversa) com ilustração leve e ação.
- **Carregando:** skeletons em tabela/cartões (demonstração breve).
- **Erro:** convite expirado (tela dedicada), erro de campo no formulário (ex.: prazo < 24h), banner de erro.
- **Sucesso:** confirmação de envio de solicitação, aprovação registrada, convite enviado.
- **Interativos:** hover, foco, seleção, desabilitado; badges de não lidas; indicador de atraso.

## 5. Percursos por público (roteiros de demonstração)

- **Diretor/Coordenador:** Painel → Aguardando aprovação → abrir demanda → Aprovar → (digital) Liberar publicação / (impresso) segunda aprovação → Liberar para impressão.
- **Designer/Videomaker/Social/Redator (membros):** Kanban → mover cartão pelas etapas de produção → enviar para aprovação → anexar link de versão.
- **Solicitante:** Portal → Nova solicitação (6 etapas, regra 24h) → acompanhar status resumido → ler resultado.
- **Gráfica:** Portal da Gráfica (mobile) → abrir pedido → confirmar versão → avançar produção → registrar entrega.
- **Administrador:** Administração → criar usuário → enviar convite → convites pendentes.
- **Visualizador interno:** navega em leitura (sem ações de produção/aprovação).

## 6. Limites (o que é simulado)

Nenhuma ação persiste após recarregar; não há backend, banco, autenticação, e-mail, Drive, calendário externo ou notificações reais. Movimentações, aprovações e envios alteram apenas o estado visual em memória, para fins de demonstração da experiência.
