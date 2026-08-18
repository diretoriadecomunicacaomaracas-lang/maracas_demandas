-- =====================================================================
-- 0003_rls.sql — Row Level Security por ambiente (v2.2)
-- Princípio: o servidor/banco é a última linha de defesa; o frontend não protege sozinho.
-- =====================================================================

-- Habilita RLS nas tabelas sensíveis
alter table usuarios enable row level security;
alter table solicitacoes enable row level security;
alter table solicitacao_mensagens enable row level security;
alter table demandas enable row level security;
alter table subdemandas enable row level security;
alter table versoes enable row level security;
alter table links_drive enable row level security;
alter table aprovacoes enable row level security;
alter table liberacoes enable row level security;
alter table pedidos_impressao enable row level security;
alter table confirmacoes_grafica enable row level security;
alter table pedido_mensagens enable row level security;
alter table comentarios enable row level security;
alter table eventos_calendario enable row level security;
alter table notificacoes enable row level security;
alter table grupos_conversa enable row level security;
alter table mensagens enable row level security;

-- ---------- USUÁRIOS ----------
create policy usuarios_self_read on usuarios for select
  using (id = auth.uid() or is_interno());

-- ---------- SOLICITAÇÕES ----------
-- Solicitante: vê as da sua secretaria principal; restritas só se criador/autorizado.
-- Interno: vê todas (para triagem). Diretor/Coordenador veem restritas.
create policy solic_select on solicitacoes for select using (
  is_interno()
  or (
    secretaria_id = minha_secretaria()
    and (restrita = false or criado_por = auth.uid()
         or exists (select 1 from solicitacao_autorizados sa
                    where sa.solicitacao_id = solicitacoes.id and sa.usuario_id = auth.uid()))
  )
);
create policy solic_insert on solicitacoes for insert with check (
  criado_por = auth.uid() and secretaria_id = minha_secretaria()
);
create policy solic_update_interno on solicitacoes for update using (is_interno());

create policy solic_msg_select on solicitacao_mensagens for select using (
  is_interno() or exists (
    select 1 from solicitacoes s where s.id = solicitacao_mensagens.solicitacao_id
      and s.secretaria_id = minha_secretaria()
  )
);
create policy solic_msg_insert on solicitacao_mensagens for insert with check (autor_id = auth.uid());

-- ---------- INTERNO (demandas, versões, aprovações, comentários, calendário) ----------
-- Apenas usuários internos. Solicitante e gráfica NÃO acessam.
create policy dem_interno_all on demandas for all using (is_interno()) with check (is_interno());
create policy sub_interno_all on subdemandas for all using (is_interno()) with check (is_interno());
create policy ver_interno_read on versoes for select using (is_interno());
create policy ver_interno_write on versoes for insert with check (is_interno());
create policy links_interno_all on links_drive for all using (is_interno()) with check (is_interno());
create policy coment_interno_all on comentarios for all using (is_interno()) with check (is_interno());
create policy cal_interno_all on eventos_calendario for all using (is_interno()) with check (is_interno());

-- Aprovar/reprovar: apenas diretor OU coordenador (permissão crítica). Impresso valida cargo específico na app.
create policy aprov_read on aprovacoes for select using (is_interno());
create policy aprov_insert on aprovacoes for insert with check (
  has_perm('aprovar_digital') or has_perm('aprovar_impresso')
);
create policy liber_read on liberacoes for select using (is_interno());
create policy liber_insert on liberacoes for insert with check (
  has_perm('liberar_publicacao') or has_perm('liberar_impressao')
);

-- ---------- PORTAL DA GRÁFICA ----------
-- A gráfica vê SOMENTE pedidos atribuídos a ela; e a versão liberada correspondente.
create policy pedido_select on pedidos_impressao for select using (
  is_interno() or grafica_id = minha_grafica()
);
create policy pedido_update_grafica on pedidos_impressao for update using (
  grafica_id = minha_grafica() or is_interno()
);
create policy conf_grafica_select on confirmacoes_grafica for select using (
  is_interno() or grafica_id = minha_grafica()
);
create policy conf_grafica_insert on confirmacoes_grafica for insert with check (
  grafica_id = minha_grafica()
);
create policy pedido_msg_select on pedido_mensagens for select using (
  is_interno() or exists (select 1 from pedidos_impressao p
    where p.id = pedido_mensagens.pedido_id and p.grafica_id = minha_grafica())
);
create policy pedido_msg_insert on pedido_mensagens for insert with check (autor_id = auth.uid());

-- Gráfica só enxerga versões liberadas dos SEUS pedidos (não rascunhos/substituídas)
create policy ver_grafica_read on versoes for select using (
  exists (
    select 1 from pedidos_impressao p
    where p.grafica_id = minha_grafica()
      and p.versao_liberada_id = versoes.id
      and versoes.estado = 'liberada_impressao'
  )
);

-- ---------- NOTIFICAÇÕES ----------
create policy notif_own on notificacoes for select using (destinatario_id = auth.uid());
create policy notif_update_own on notificacoes for update using (destinatario_id = auth.uid());

-- ---------- CONVERSAS (só internos e membros do grupo) ----------
create policy grupos_membro on grupos_conversa for select using (
  is_interno() and exists (select 1 from grupo_membros gm
    where gm.grupo_id = grupos_conversa.id and gm.usuario_id = auth.uid())
);
create policy msg_membro_read on mensagens for select using (
  exists (select 1 from grupo_membros gm where gm.grupo_id = mensagens.grupo_id and gm.usuario_id = auth.uid())
);
create policy msg_membro_insert on mensagens for insert with check (
  autor_id = auth.uid()
  and exists (select 1 from grupo_membros gm where gm.grupo_id = mensagens.grupo_id and gm.usuario_id = auth.uid())
);
create policy msg_edit_own on mensagens for update using (autor_id = auth.uid() or has_perm('moderar_conversa'));
