# Relatório — página central da demanda, voltar e clicáveis

## SQL a aplicar no Supabase (novo)
No **SQL Editor**, cole e rode **`supabase/PATCH_0006.sql`** (idempotente):
```sql
alter table subdemandas add column if not exists resumo text;
alter table subdemandas add column if not exists observacoes text;
alter table subdemandas add column if not exists conteudo jsonb not null default '{}'::jsonb;
alter table links_drive  add column if not exists deleted_at timestamptz;
alter table links_drive  add column if not exists updated_at timestamptz;
alter table checklists   add column if not exists responsavel_id uuid references usuarios(id);
alter table checklists   add column if not exists deleted_at timestamptz;
alter table checklists   add column if not exists created_by uuid references usuarios(id);
alter table comentarios  add column if not exists editada boolean not null default false;
alter table comentarios  add column if not exists responde_a uuid references comentarios(id);
create table if not exists comentario_mencoes (comentario_id uuid references comentarios(id) on delete cascade, usuario_id uuid references usuarios(id) on delete cascade, primary key (comentario_id, usuario_id));
```
(Instalações novas já incluem no `HOMOLOGACAO_completo.sql`.)

## Arquivos / rotas
- **Voltar:** `src/components/interno/BackButton.tsx` (BackButton + Breadcrumb). Adicionado ao detalhe da demanda, triagem e notificações. Rota canônica da demanda continua **`/app/demandas/[id]`**.
- **Clicáveis:** `KanbanBoard.tsx` (clique abre a demanda; arraste move), `LinhaDemanda.tsx` (linha da tabela clicável), `calendario/page.tsx` (evento → demanda). Notificações já abrem via `referencia_url`.
- **Página central:** `src/app/app/demandas/[id]/page.tsx` (carrega tudo) + `src/components/interno/tarefa/PaginaTarefa.tsx` + seções `ConteudoSection`, `LinksSection`, `ChecklistSection`, `ComentariosSection`, hook `useDirty`.
- **Dados:** `src/server/data/demandas.ts` (getSubdemandaCompleta, editarGerencial, editarOperacional, finalizarDemanda), `links.ts`, `checklist.ts`, `comentarios.ts`, `src/domain/conteudo.ts` (campos por tipo).
- **Migration:** `0006_tarefa_dinamica.sql` (+ `PATCH_0006.sql`).

## Como clique e arraste foram diferenciados no Kanban
O cartão é `draggable`. Registro a posição no `onPointerDown` e, no `onClick`, calculo a distância até o ponto inicial: se **< 6px** e não houve `dragStart`, é **clique** → abre `/app/demandas/[id]`. Se houve arraste (dragStart marca `moved`), o clique é ignorado e a movimentação segue as validações já aprovadas. Também abre com Enter (acessível).

## Campos editáveis e permissões
- **Gerenciais (Diretor/Coordenador):** título, tipo, área/fluxo, prioridade, prazo, briefing interno consolidado. Prioridade **emergencial** exige permissão específica. Secretaria/setor permanecem read-only (vêm da solicitação).
- **Operacionais (responsável/colaboradores com `editar_operacional`):** resumo, observações, **conteúdo por tipo**, data de publicação, links, checklist, comentários.
- **Briefing original:** somente leitura, preservado, identificado como do solicitante.
- **Visualizador:** somente leitura em tudo.
Cada edição persiste no Supabase, registra **auditoria** (valor anterior/novo) e dispara **notificação** aos envolvidos quando relevante (prazo/prioridade, responsável, colaborador, conteúdo, etapa, finalização, menção).

## Estrutura de "Roteiro e conteúdo" por tipo
Guardado em `subdemandas.conteudo` (**jsonb**), renderizado a partir de `src/domain/conteudo.ts` — só aparecem os campos do tipo: **digital** (texto do card, legenda, chamada, hashtags, canais, observações); **audiovisual** (roteiro, cenas, falas, entrevistados, local, data/hora de gravação, duração, formato, captação, legenda, canais); **impresso** (texto da peça, medidas, quantidade, material, acabamento, local de entrega, prazo da gráfica, obs. técnicas).

## Links de referência
Guardados em `links_drive` com `tipo`, `titulo`, `descricao`, `url`, autor e data; exclusão **lógica** (`deleted_at`). A aba deixa claro que **referências não são versões** (versões continuam na aba própria). Ações: adicionar, remover, copiar endereço, abrir em nova aba.

## Auditoria e notificações
- Auditoria em: edição gerencial/operacional, links, checklist, responsável/colaboradores, etapa, versões/aprovações, finalização, reabertura.
- Notificações aos envolvidos (não ao próprio autor) em: prazo/prioridade, troca de responsável, inclusão/remoção de colaborador, conteúdo, etapa, nova versão, menção, finalização.

## Estrutura da página (abas)
Visão geral · Briefing · Roteiro e conteúdo · Datas e agenda · Responsáveis · Links e referências · Versões e aprovações · Checklist · Comentários · Histórico. Cabeçalho com protocolo, título, tipo, secretaria/setor, etapa, status, prioridade, prazo, atraso, responsável, colaboradores, criação e última atualização. Subdemandas da mesma campanha aparecem clicáveis na Visão geral.

## Experiência de edição
Botão “Editar” por seção; “Salvar alterações”/“Cancelar”; botão desabilitado e “Salvando…” durante o envio; **aviso de alterações não salvas** ao tentar sair (beforeunload); erros não apagam o que foi digitado; mudanças rápidas (prioridade/responsável) com confirmação visual, mensagem de sucesso e persistência após F5.

## Testes
- **81 asserções, 0 falhas** (`npm run test:local`), incluindo 8 novos de campos/permissões de conteúdo. 52 módulos `.ts` válidos; componentes `.tsx` com chaves balanceadas (não executo o navegador aqui).

## Roteiro curto de reteste
1. Rode **`PATCH_0006.sql`** no Supabase. Atualize o código; `npm install` se necessário; `npm run test:local` (81/0); `npm run dev`.
2. **Voltar:** em qualquer página secundária (detalhe da demanda, triagem, notificações) use a **seta Voltar**.
3. **Clicáveis:** na **Tabela** clique na linha → abre a demanda; no **Kanban** clique no cartão → abre; **arraste** um cartão → move sem abrir; clique numa **notificação** e num **evento do calendário** → abrem a mesma demanda.
4. **Editar (Coordenador):** prazo, prioridade, briefing consolidado, responsável; veja refletir na Tabela/Kanban e no Histórico; recarregue (F5).
5. **Operacional (responsável/Designer):** edite “Roteiro e conteúdo”, adicione **link de referência** (não vira versão), marque itens do **checklist**, comente com **@Nome**.
6. **Bloqueios:** Designer não edita campos gerenciais; Visualizador não edita nada; briefing original permanece intacto.
7. **Não salvo:** comece a editar uma seção e tente fechar a aba → o navegador avisa.

Nada publicado na Vercel.
