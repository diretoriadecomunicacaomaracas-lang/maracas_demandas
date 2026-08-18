# Relatório da rodada — Ajustes de briefing e responsáveis

## Arquivos alterados/criados
**Ajuste 1 (briefing + triagem):**
- `supabase/migrations/0005_briefing_e_avatar.sql` (novo), `supabase/PATCH_0005.sql` (delta p/ colar), `supabase/HOMOLOGACAO_completo.sql` (inclui 0005).
- `src/domain/triagem.ts` (novo: validador de aprovação), `tests/integration/triagem.test.ts` (novo).
- `src/server/data/solicitacoes.ts` (getSolicitacaoCompleta, salvarBriefingInterno, aprovarParaDemanda, triagem).
- `src/app/app/solicitacoes/[id]/page.tsx` (novo: tela de triagem) + `src/components/interno/TriagemDetalhe.tsx` (novo: abas Resumo/Briefing original/Briefing interno/Responsáveis/Mensagens/Histórico + ações).
- `src/app/app/solicitacoes/page.tsx` (linka título/“Abrir” para a triagem).

**Ajuste 2 (responsáveis):**
- `src/components/ui/Avatar.tsx` (novo: avatar por URL/iniciais + pilha + tooltip).
- `src/server/data/usuarios.ts` (novo: internos + mapa), `src/server/data/demandas.ts` (listarSubdemandasComEquipe, equipeDaSubdemanda, atribuir/adicionar/remover).
- `src/app/app/demandas/page.tsx` (coluna Responsável), `src/components/interno/KanbanBoard.tsx` (avatar no cartão), `src/app/app/demandas/[id]/page.tsx` + `src/components/interno/DetalheDemanda.tsx` (aba “Responsáveis e equipe”).

## Campos e tabelas utilizados / modelagem
- **Briefing original:** coluna existente `solicitacoes.descricao` — **somente leitura** na equipe interna.
- **Briefing interno consolidado:** **nova** coluna `solicitacoes.briefing_interno` (editável por Coord/Diretor). Ao aprovar, é copiado para a **nova** coluna `demandas.briefing_consolidado`. Também adicionadas `demandas.secretaria_id` e `demandas.unidade_id` para carregar o contexto.
- **Vínculo original preservado:** `demandas.solicitacao_id` (já existia) — o briefing original continua acessível pela demanda via esse vínculo.
- **Responsáveis/membros:** `subdemandas.responsavel_id` (existente) + tabela `subdemanda_membros` (existente) — cada subdemanda tem **responsável e colaboradores próprios**, prazo e etapa próprios. A demanda principal agrega as subdemandas.
- **Avatar:** **nova** coluna `usuarios.avatar_url` (opcional). Sem foto → **iniciais** geradas automaticamente. Sem upload nesta rodada (URL/ativo administrativo).
- **Auditoria:** alterações de briefing interno, responsável e membros registram usuário, data/hora e valores anterior/novo em `auditoria`.

## Migration adicional / SQL a aplicar no Supabase
**SIM — é necessário rodar um SQL novo** (curto e idempotente). No **SQL Editor** do Supabase, cole e rode o conteúdo de **`supabase/PATCH_0005.sql`**:
```sql
alter table solicitacoes add column if not exists briefing_interno text;
alter table demandas     add column if not exists briefing_consolidado text;
alter table demandas     add column if not exists secretaria_id uuid references secretarias(id);
alter table demandas     add column if not exists unidade_id uuid references unidades(id);
alter table usuarios     add column if not exists avatar_url text;
```
(Instalações novas já têm isso no `HOMOLOGACAO_completo.sql`.) Opcional: para ver fotos, preencha `usuarios.avatar_url` no Table Editor; sem isso aparecem as iniciais.

## Roteiro curto para repetir os testes
1. Rode o **PATCH_0005.sql** no Supabase (uma vez). Atualize o código do pacote (mantém o `.env.local`); `npm install` se necessário.
2. `npm run test:local` → esperado **73 asserções, 0 falhas** (inclui 8 de triagem).
3. `npm run dev` e teste:
   - **Solicitante** cria solicitação com briefing.
   - **Coordenador** → Central → **Abrir** a solicitação → aba **Briefing original** (só leitura) → aba **Briefing interno** (editar + Salvar; recarregue e confira; veja o **Histórico**).
   - Aba **Responsáveis**: defina tipo, área/fluxo, prazo, prioridade e **responsável** (ou marque “aguardando distribuição”) → **Aprovar e transformar em demanda** (sem os campos obrigatórios, aparece a lista de pendências).
   - Abra a **demanda** gerada: o **briefing consolidado** veio junto; o vínculo com a solicitação está preservado; aba **Responsáveis** permite atribuir/substituir/adicionar/remover (só Diretor/Coordenador).
   - **Tabela** e **Kanban**: veja avatar + nome do responsável (e colaboradores empilhados); sem responsável mostra “Aguardando distribuição”/“Sem responsável”; tooltip mostra nome e função; sem foto = iniciais.
   - **Designer**: não consegue alterar a distribuição (botões restritos).
4. Recarregue (F5) e confira a persistência.

## Situação
Briefing duplo (original preservado + interno consolidado auditado), tela de triagem com abas e validação na aprovação, e responsáveis visíveis em tabela/Kanban/detalhe. **Nada publicado na Vercel.** Rode o PATCH e o roteiro e me diga o resultado (ou cole erros, sem chaves).
