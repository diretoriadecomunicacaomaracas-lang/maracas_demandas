import { createSupabaseServer } from "@/lib/supabase-server";
import { can, type CargoChave, type PermissaoChave } from "@/lib/permissions";

// Carrega cargos do usuário autenticado e valida permissão NO SERVIDOR (nunca confie só no cliente).
export async function exigirPermissao(p: PermissaoChave) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("NAO_AUTENTICADO");
  const { data } = await supabase
    .from("usuario_cargos")
    .select("cargos(chave)")
    .eq("usuario_id", user.id);
  const cargos = (data ?? []).map((r: any) => r.cargos.chave as CargoChave);
  if (!can(cargos, p)) throw new Error(`SEM_PERMISSAO:${p}`);
  return { userId: user.id, cargos };
}
