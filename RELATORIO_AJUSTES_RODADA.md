# Relatório da rodada — Ajustes 1, 2 e 3

## Arquivos alterados/criados
- **Kanban (Ajuste 3):** `src/domain/flows.ts` (+transições reais), `src/server/data/demandas.ts` (moverEtapa usa transições explícitas + mensagem), `src/components/interno/KanbanBoard.tsx` (reescrito: colunas por etapa/tipo, destinos pré-checados), `tests/integration/kanban.test.ts` (novo).
- **Setor/unidade (Ajuste 1):** `src/server/context.ts` (+unidadeId), `src/server/data/unidades.ts` (novo: listar/criar), `src/server/data/solicitacoes.ts` (valida e salva setor), `src/app/portal/nova/page.tsx` (server carrega setores) + `src/components/interno/NovaSolicitacaoForm.tsx` (novo: campo obrigatório Setor), `src/components/interno/AdminSetores.tsx` (novo: cadastro), `src/app/app/admin/page.tsx` (+bloco Setores), `src/app/portal/[id]/page.tsx` (mostra secretaria/setor).
- **Central (Ajuste 2):** `src/server/data/solicitacoes.ts` (`listarCentral`, triagem com `iniciar_analise` + justificativa), `src/app/app/solicitacoes/page.tsx` (reescrito: abas + colunas completas + fila cronológica), `src/components/interno/TriagemBotoes.tsx` (iniciar análise + justificativa).
- **Testes:** `e2e/setor-e-central.spec.ts` (novo); `package.json` (`test:local` inclui kanban).

## Causa encontrada para o erro do Kanban
As colunas eram **macroetapas** (camada 1) e o drop era convertido para a **primeira etapa** daquela macro. Como a validação só aceitava etapas **estritamente adjacentes**, mover "Planejamento → Em produção" virava "planejamento → criacao" **pulando** "distribuicao" → adjacência falhava → "Transição inválida". Não era permissão, cargo, acento nem enum (a coluna `etapa` é texto e guarda códigos internos). Correção: colunas passam a ser as **etapas reais do fluxo (camada 2)** por tipo, com **tabela de transições explícita**.

## Transições implementadas (arraste)
- **Digital:** planejamento→{distribuição, em criação}; distribuição→{em criação, planejamento}; em criação→{revisão, distribuição}; revisão→{em criação, aguardando aprovação}; aguardando aprovação→{revisão, correção}; correção→{em criação, revisão}.
- **Audiovisual:** planejamento→roteiro→aguardando gravação→em gravação→aguardando edição→em edição→revisão→aguardando aprovação; com devoluções para a etapa anterior; correção→{em edição, revisão}.
- **Impresso:** planejamento→em criação→revisão→aguardando aprovação do Coordenador (e devoluções).
- Etapas de **aprovação/liberação/produção gráfica** avançam **por ação** (botões), não pelo arraste. Destino inválido não move e mostra: *"Esta demanda está em 'X'. As próximas etapas permitidas são 'A' e 'B'."*. Reversão só em falha real no servidor. **Regras por cargo mantidas** (Coordenador move + ações críticas; Designer move produção quando responsável/membro; Designer bloqueado em aprovações).

## Migrations adicionais / novo SQL no Supabase
**Nenhum.** O setor usa colunas **já existentes** no schema aplicado (`solicitacoes.unidade_id`, `usuarios.unidade_id`, tabela `unidades`). Os novos status (`em_analise`) são apenas valores de texto em `status_externo` (coluna text, sem enum). **Você não precisa rodar nenhum SQL novo no Supabase.** Basta atualizar o código.
> Opcional: para o "setor padrão" já vir preenchido, defina `usuarios.unidade_id` do solicitante (via Table Editor). Sem isso, o seletor apenas não vem pré-selecionado.

## Roteiro curto para repetir os testes localmente
1. `git pull`/descompacte o novo pacote sobre o projeto (mantém seu `.env.local`). `npm install` (se necessário).
2. `npm run test:local` → esperado **65 asserções, 0 falhas** (inclui 10 do Kanban).
3. `npm run dev` e teste:
   - **Solicitante Saúde** (`saude@…`): Nova solicitação → o campo **Setor** mostra só setores da Saúde; envie.
   - **Coordenador** (`coord@…`): Central → veja abas (Pendentes/Em análise/Aguardando/Processadas/Todas), colunas com secretaria/setor/solicitante/chegada/prazo e "tempo aguardando"; **Aprovar** → o item sai de Pendentes, aparece em **Processadas/Todas** com decisão e botão **Abrir demanda**.
   - **Kanban** (`/app/demandas/kanban`): selecione o tipo, arraste um cartão de Planejamento para "Em criação" (agora **funciona**); tente uma etapa inválida → aparece a mensagem com os destinos permitidos e o cartão **não** se move.
   - **Designer** (`designer@…`): move etapas de produção quando membro; segue **bloqueado** em aprovações.
   - Recarregue (F5) e confira persistência; confira o **Histórico** da demanda (origem/destino/usuário/data).
4. Se cadastrar novos setores: **Administrador** (`admin@…`) → Administração → **Setores** → escolha a secretaria, digite o nome, Cadastrar.

## Situação
Kanban corrigido e coberto por teste; setor/unidade obrigatório e isolado por secretaria; Central com abas e registro institucional preservado. **Nada publicado na Vercel.** Rode o roteiro acima e me diga o resultado (ou cole erros, sem chaves) para seguirmos.
