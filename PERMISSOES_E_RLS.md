# PERMISSÕES E ROW LEVEL SECURITY

## 1. Modelo
`usuarios —(N:N)— cargos —(N:N)— permissoes`. Um usuário acumula cargos; as permissões são a união. As **permissões críticas** (aprovação, liberação, reabertura, reimpressão, prioridade emergencial, alteração de permissões, restrição de solicitação, exclusão lógica) são marcadas `critica=true` e não podem ser concedidas livremente a cargos personalizados (regra aplicada na tela de administração + verificação no servidor).

## 2. Matriz (resumo — fonte: v2.2, seed.sql e src/lib/permissions.ts)
- **Diretor:** todas as ações de negócio (aprovar, liberar, reabrir, reimpressão, emergencial, restrição, exclusão lógica) + governança de usuários/permissões.
- **Coordenador:** como o Diretor, exceto `alterar_permissoes` e `administrar_usuarios`.
- **Administrador:** governança (`alterar_permissoes`, `administrar_usuarios`, `excluir_logico`) — sem aprovações de negócio.
- **Designer/Videomaker/Jornalista:** `criar_demanda`, `movimentar_producao`, `editar_operacional`.
- **Social Media:** idem + `registrar_publicacao`.
- **Solicitante/Visualizador:** sem permissões de ação (visualizador só lê o interno).
- **Gráfica:** `confirmar_pedido_grafica`.

Impresso: `pode_liberar_impressao` exige aprovação ativa de **coordenador E diretor** na mesma versão (não basta a permissão do cargo).

## 3. Validação em duas camadas
1. **Servidor** — `src/server/guard.ts::exigirPermissao(p)` carrega os cargos do usuário e bloqueia a ação. Nunca confie apenas no cliente.
2. **Banco (RLS)** — `0003_rls.sql`. Políticas por ambiente:
   - **Solicitações:** solicitante vê as da sua **secretaria principal**; restrita só criador/autorizado; interno vê todas (triagem).
   - **Interno (demandas/versões/aprovações/comentários/calendário):** apenas `is_interno()`.
   - **Gráfica:** só pedidos com `grafica_id = minha_grafica()`; só a **versão liberada** dos seus pedidos (rascunhos/substituídas ocultas).
   - **Notificações:** só do próprio destinatário.
   - **Conversas:** só internos membros do grupo.

## 4. Funções de apoio (SECURITY DEFINER)
`has_cargo(chave)`, `has_perm(chave)`, `is_interno()`, `minha_secretaria()`, `minha_grafica()`, `pode_liberar_impressao(versao)`.

## 5. Testes (ver TESTES.md)
Cobrem: solicitante não acessa interno; vê só a própria secretaria; restrita respeita exceções; gráfica só pedidos atribuídos; digital exige aprovação; liberação separada; impresso exige duas aprovações da mesma versão; nova versão invalida; membro move mas não aprova; permissões validadas no servidor.
