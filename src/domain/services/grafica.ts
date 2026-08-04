import type { Store } from "../store.ts";
import type { Ator } from "../types.ts";
import { uid, agora } from "../store.ts";
import { can } from "../../lib/permissions.ts";
import { registrar } from "./auditoria.ts";

// Pedidos visíveis à gráfica: só os atribuídos a ela.
export function pedidosDaGrafica(db: Store, ator: Ator) {
  if (ator.ambiente !== "grafica") return [];
  return db.pedidos.filter(p => p.graficaId === ator.graficaId);
}
// Confirmar versão liberada (termo). Deve ser a versão vigente liberada do pedido.
export function confirmarVersao(db: Store, ator: Ator, pedidoId: string): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "confirmar_pedido_grafica")) return { ok: false, erro: "Ação exclusiva da gráfica." };
  const ped = db.pedidos.find(p => p.id === pedidoId); if (!ped) return { ok: false, erro: "Pedido não encontrado." };
  if (ped.graficaId !== ator.graficaId) return { ok: false, erro: "Pedido não atribuído à sua gráfica." };
  if (!ped.versaoLiberadaId) return { ok: false, erro: "Não há versão liberada para confirmar." };
  db.confirmacoes.push({ id: uid("cnf"), pedidoId, versaoId: ped.versaoLiberadaId, usuarioId: ator.id, graficaId: ator.graficaId, ativa: true, createdAt: agora() });
  ped.status = "pedido_confirmado";
  registrar(db, "pedido", ped.id, "confirmacao_grafica", ator.id, { novo: { versaoId: ped.versaoLiberadaId } });
  return { ok: true };
}
export function atualizarProducao(db: Store, ator: Ator, pedidoId: string, status: "prod_grafica" | "pronto" | "transporte" | "entregue"): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "confirmar_pedido_grafica")) return { ok: false, erro: "Ação exclusiva da gráfica." };
  const ped = db.pedidos.find(p => p.id === pedidoId && p.graficaId === ator.graficaId); if (!ped) return { ok: false, erro: "Pedido não encontrado." };
  ped.status = status; registrar(db, "pedido", ped.id, `producao:${status}`, ator.id);
  return { ok: true };
}
