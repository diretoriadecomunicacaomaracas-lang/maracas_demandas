// Matriz de permissões (v2.2). Fonte de verdade também no banco (seed + RLS).
// Esta cópia serve para checagens no servidor (route handlers/server actions) e para a UI.
export type CargoChave =
  | "administrador" | "diretor" | "coordenador" | "designer" | "videomaker"
  | "social_media" | "jornalista" | "solicitante" | "grafica" | "visualizador";

export type PermissaoChave =
  | "aprovar_digital" | "aprovar_impresso" | "liberar_publicacao" | "liberar_impressao"
  | "reprovar" | "autorizar_reimpressao" | "reabrir_demanda" | "prioridade_emergencial"
  | "restringir_solicitacao" | "excluir_logico" | "alterar_permissoes" | "administrar_usuarios"
  | "triagem" | "criar_demanda" | "editar_admin_demanda" | "movimentar_producao"
  | "editar_operacional" | "confirmar_pedido_grafica" | "moderar_conversa" | "registrar_publicacao";

export const PERMISSOES_CRITICAS: PermissaoChave[] = [
  "aprovar_digital","aprovar_impresso","liberar_publicacao","liberar_impressao","reprovar",
  "autorizar_reimpressao","reabrir_demanda","prioridade_emergencial","restringir_solicitacao",
  "excluir_logico","alterar_permissoes","administrar_usuarios",
];

const M: Record<CargoChave, PermissaoChave[]> = {
  diretor: ["aprovar_digital","aprovar_impresso","liberar_publicacao","liberar_impressao","reprovar",
    "autorizar_reimpressao","reabrir_demanda","prioridade_emergencial","restringir_solicitacao",
    "excluir_logico","alterar_permissoes","administrar_usuarios","triagem","criar_demanda",
    "editar_admin_demanda","movimentar_producao","editar_operacional","registrar_publicacao","moderar_conversa"],
  coordenador: ["aprovar_digital","aprovar_impresso","liberar_publicacao","liberar_impressao","reprovar",
    "autorizar_reimpressao","reabrir_demanda","prioridade_emergencial","restringir_solicitacao",
    "excluir_logico","triagem","criar_demanda","editar_admin_demanda","movimentar_producao",
    "editar_operacional","registrar_publicacao","moderar_conversa"],
  administrador: ["alterar_permissoes","administrar_usuarios","excluir_logico"],
  designer: ["criar_demanda","movimentar_producao","editar_operacional"],
  videomaker: ["criar_demanda","movimentar_producao","editar_operacional"],
  social_media: ["criar_demanda","movimentar_producao","editar_operacional","registrar_publicacao"],
  jornalista: ["criar_demanda","movimentar_producao","editar_operacional"],
  visualizador: [],
  solicitante: [],
  grafica: ["confirmar_pedido_grafica"],
};

export function permissoesDe(cargos: CargoChave[]): Set<PermissaoChave> {
  const s = new Set<PermissaoChave>();
  for (const c of cargos) (M[c] ?? []).forEach((p) => s.add(p));
  return s;
}
export function can(cargos: CargoChave[], p: PermissaoChave): boolean {
  return permissoesDe(cargos).has(p);
}
// Regra crítica: impresso exige aprovação de coordenador E diretor na MESMA versão.
export function podeLiberarImpressao(aprovacoesAtivas: { cargo: CargoChave }[]): boolean {
  const cargos = new Set(aprovacoesAtivas.map((a) => a.cargo));
  return cargos.has("coordenador") && cargos.has("diretor");
}
// Ambiente de destino após login (acúmulo → interno mais completo).
export function ambienteDestino(cargos: CargoChave[]): "interno" | "solicitante" | "grafica" {
  if (cargos.some((c) => ["administrador","diretor","coordenador","designer","videomaker","social_media","jornalista","visualizador"].includes(c))) return "interno";
  if (cargos.includes("grafica")) return "grafica";
  return "solicitante";
}
