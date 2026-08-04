-- =====================================================================
-- seed.sql — Dados de referência + matriz de permissões (v2.2)
-- Usuários de demonstração são criados via scripts/seed-demo-users.ts
-- (precisam existir em auth.users antes de usuarios).
-- =====================================================================

-- Cargos iniciais
insert into cargos(chave,nome,inicial) values
 ('administrador','Administrador do Sistema',true),
 ('diretor','Diretor de Comunicação',true),
 ('coordenador','Coordenador de Comunicação',true),
 ('designer','Designer',true),
 ('videomaker','Videomaker',true),
 ('social_media','Social Media',true),
 ('jornalista','Jornalista ou Redator',true),
 ('solicitante','Solicitante',true),
 ('grafica','Gráfica',true),
 ('visualizador','Visualizador Interno',true)
on conflict (chave) do nothing;

-- Permissões (críticas marcadas)
insert into permissoes(chave,descricao,critica) values
 ('aprovar_digital','Aprovar material digital/audiovisual',true),
 ('aprovar_impresso','Aprovar material impresso (dupla aprovação)',true),
 ('liberar_publicacao','Liberar para publicação',true),
 ('liberar_impressao','Liberar para impressão',true),
 ('reprovar','Solicitar correção / reprovar',true),
 ('autorizar_reimpressao','Autorizar reimpressão',true),
 ('reabrir_demanda','Reabrir demanda finalizada',true),
 ('prioridade_emergencial','Definir prioridade emergencial',true),
 ('restringir_solicitacao','Marcar/retirar restrição de solicitação',true),
 ('excluir_logico','Excluir logicamente / restaurar',true),
 ('alterar_permissoes','Alterar permissões críticas',true),
 ('administrar_usuarios','Administrar cargos e usuários',true),
 ('triagem','Triagem de solicitações',false),
 ('criar_demanda','Criar/editar demanda e subdemanda',false),
 ('editar_admin_demanda','Editar campos administrativos da demanda',false),
 ('movimentar_producao','Movimentar subdemanda (produção)',false),
 ('editar_operacional','Editar campos operacionais/links/versões',false),
 ('confirmar_pedido_grafica','Confirmar/atualizar pedido (gráfica)',false),
 ('moderar_conversa','Moderar/administrar grupos de conversa',false),
 ('registrar_publicacao','Registrar publicação',false)
on conflict (chave) do nothing;

-- Matriz cargo x permissão (resumo v2.2)
-- Diretor
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='diretor' and p.chave in
   ('aprovar_digital','aprovar_impresso','liberar_publicacao','liberar_impressao','reprovar',
    'autorizar_reimpressao','reabrir_demanda','prioridade_emergencial','restringir_solicitacao',
    'excluir_logico','alterar_permissoes','administrar_usuarios','triagem','criar_demanda',
    'editar_admin_demanda','movimentar_producao','editar_operacional','registrar_publicacao','moderar_conversa')
on conflict do nothing;
-- Coordenador (sem alterar_permissoes/administrar_usuarios)
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='coordenador' and p.chave in
   ('aprovar_digital','aprovar_impresso','liberar_publicacao','liberar_impressao','reprovar',
    'autorizar_reimpressao','reabrir_demanda','prioridade_emergencial','restringir_solicitacao',
    'excluir_logico','triagem','criar_demanda','editar_admin_demanda','movimentar_producao',
    'editar_operacional','registrar_publicacao','moderar_conversa')
on conflict do nothing;
-- Administrador (governança de contas/permissões, sem aprovações de negócio)
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='administrador' and p.chave in
   ('alterar_permissoes','administrar_usuarios','excluir_logico')
on conflict do nothing;
-- Membros de produção (designer, videomaker, social_media, jornalista)
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave in ('designer','videomaker','social_media','jornalista')
    and p.chave in ('criar_demanda','movimentar_producao','editar_operacional')
on conflict do nothing;
-- Social media também registra publicação
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='social_media' and p.chave='registrar_publicacao'
on conflict do nothing;
-- Gráfica
insert into cargo_permissoes
  select c.id, p.id from cargos c, permissoes p
  where c.chave='grafica' and p.chave='confirmar_pedido_grafica'
on conflict do nothing;

-- Secretarias principais + unidades
insert into secretarias(nome) values
 ('Saúde'),('Educação'),('Agricultura'),('Infraestrutura'),
 ('Assistência Social'),('Cultura'),('Esportes'),('Gabinete')
on conflict do nothing;
insert into unidades(secretaria_id,nome)
  select id,'Vigilância Epidemiológica' from secretarias where nome='Saúde'
  union all select id,'Vigilância Sanitária' from secretarias where nome='Saúde'
  union all select id,'Atenção Básica' from secretarias where nome='Saúde'
  union all select id,'Hospital Municipal' from secretarias where nome='Saúde'
  union all select id,'Ensino Fundamental' from secretarias where nome='Educação'
  union all select id,'Agricultura Familiar' from secretarias where nome='Agricultura';

-- Gráficas
insert into graficas(nome,contato_email) values
 ('Gráfica Boa Impressão','contato@boaimpressao.com.br'),
 ('Gráfica Central Maracás','central@graficamaracas.com.br')
on conflict do nothing;

-- Grupos operacionais / de conversa iniciais
insert into grupos_operacionais(nome) values
 ('Geral'),('Coordenação'),('Criação'),('Audiovisual'),
 ('Social Media e Publicações'),('Jornalismo e Coberturas'),('Impressos');
insert into grupos_conversa(nome,descricao)
  select nome, 'Grupo interno de conversa' from grupos_operacionais;
