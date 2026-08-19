# STATUS — Finalização Funcional (v1.0)

Ponto de recuperação. ✅ = funciona e testado · ⚠️ = implementado, depende de SQL/config/teste manual · ❌ = não implementado.

## Concluído nesta rodada
- **Menu do usuário:** Perfil · Configurações · Sair. ✅
- **Perfil** (`/app/perfil`): ver dados, editar nome, avatar por URL, BackButton. ✅ · upload de foto p/ Storage ⚠️ (requer bucket do PATCH_0008).
- **Configurações** (`/app/configuracoes`): alterar senha (reautentica a senha atual no cliente, valida força/coincidência, Supabase Auth) + Aparência (Claro/Escuro/Sistema, persistente). ✅
- **Recuperação de senha:** `/recuperar` (mensagem neutra, sem enumeração) → e-mail Supabase → `/auth/callback?next=/redefinir` → `/redefinir` (nova/repetir, mostrar/ocultar, força, token inválido/expirado). ⚠️ entrega real do e-mail depende de SMTP (teste manual pendente).
- **Modo escuro:** tokens semânticos (navy), toggle no header (Sol/Lua), persistência, no-flash, `prefers-color-scheme`, overrides p/ cards/inputs/modais/tabelas/tones/chat/calendário. ✅
- **BackButton** reutilizável em Perfil/Configurações/telas secundárias. ✅
- **Central de Solicitações:** linha só com **Analisar**; análise com **Aprovar para Planejamento** fixo no topo (sticky). ✅
- **Automação Solicitação → Planejamento:** `aprovarParaPlanejamento` idempotente (sem duplicar demanda), cria no **Backlog** (etapa planejamento), auditoria, notifica solicitante. ✅
- **Backlog/Planejamento:** agendar **exige responsável** (modal de seleção); ao agendar vira **Aguardando distribuição**; **Iniciar produção** (responsável) → Criação (digital/impresso) / Roteiro (audiovisual). ✅
- **Minha fila** (Criação/Audiovisual): usa `auth.uid()` (responsável/colaborador). ✅
- **Bate-papo** (`/app/conversas`, renomeado): grupos (GERAL/CRIAÇÃO/AUDIOVISUAL, membros por cargo, idempotente), enviar/editar/excluir, **@menções → notificação**, não lidas + contador, pesquisa, avatar, data/hora, polling (fallback ao Realtime). ✅
- **Notificações:** sino com badge (99+), central (marcar lida / todas), destino ao clicar; fontes: nova solicitação, aprovação p/ planejamento, atribuição/agendamento, @menção. ✅
- **Ajuda `?`:** drawer contextual por rota + legenda de etapas. ✅
- **Arquivadas/Lixeira:** Lixeira saiu do menu; `/app/arquivadas` com abas **Arquivadas | Lixeira**; exclusão lógica grava `deleted_at`; Lixeira mostra quem/quando/motivo + **"Exclusão definitiva em X dias"** (30d). ✅ · purga automática ⚠️ (função `purgar_lixeira_expirada` no PATCH_0008 + agendamento manual).
- **Administração:** movida ao rodapé da Sidebar (divisor), visível só p/ Diretor/Admin; **rota protegida no servidor**. CRUDs: Usuários (listar/ativar-desativar/criar por convite), Secretarias, Setores/Unidades, Gráficas, Grupos (+membros). Auditoria em todas as ações. ✅ · criação de usuário depende de **SMTP** p/ o convite chegar ⚠️.

## Preservado (aprovado, não redesenhado)
Login/logout, Busca Global, Painel, Kanban, detalhe da demanda, painéis Criação/Audiovisual/Impressos, Calendário, Portal do Solicitante/Gráfica, permissões/RLS, animações.

## SQL necessário (nenhum executado por mim) — ORDEM
1. **PATCH_0007_busca_e_visibilidade.sql** (se ainda não aplicado) — busca acento-insensível, protocolo de demanda, mensagens internas.
2. **PATCH_0008_perfil_chat_retencao.sql** — bucket `avatares` (Storage), policy de insert do chat, função de purga da Lixeira (30d) + agendamento.

## Ação manual do responsável
- Aplicar PATCH_0007 e depois PATCH_0008 no SQL Editor.
- **SMTP de produção:** o projeto usa o SMTP padrão do Supabase Auth (não verificável só pelo código). Configurar/validar Custom SMTP ou Resend para entrega de convites e recuperação.
- Testar **um e-mail real** (recuperação + convite) na caixa de entrada.
- Agendar `purgar_lixeira_expirada()` (pg_cron ou Scheduled Function).

## Testes
- test:local ✅ · vitest ✅ (32) · build ✅ · e2e login/logout ✅ (Coordenador→interno, Solicitante→portal, logout).

## Pendências para próximas rodadas
- Anexos nas solicitações (Storage privado + URL assinada) — Fase K/L.
- Consolidação de macroetapas dos fluxos (Fase C) e modalidades múltiplas do audiovisual.
- Drag&drop e visões semana/dia do calendário; Realtime nativo no chat.
