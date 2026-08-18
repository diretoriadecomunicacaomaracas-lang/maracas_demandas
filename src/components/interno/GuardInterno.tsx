import { getAtor } from "@/server/context";
import { redirect } from "next/navigation";
import type { PermissaoChave } from "@/lib/permissions";
import { can } from "@/lib/permissions";
// Guarda de rota no servidor (bloqueia acesso indevido, inclusive por URL direta).
export async function exigirInterno(perm?: PermissaoChave) {
  const ator = await getAtor();
  if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  if (perm && !can(ator.cargos, perm)) redirect("/app/painel");
  return ator;
}
