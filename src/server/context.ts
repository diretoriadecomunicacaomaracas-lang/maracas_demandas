import { createSupabaseServer } from "@/lib/supabase-server";
import type { CargoChave } from "@/lib/permissions";

export interface Ator {
  id: string; nome: string; email: string; cargos: CargoChave[];
  ambiente: "interno" | "solicitante" | "grafica";
  secretariaId: string | null; unidadeId: string | null; graficaId: string | null;
}

// Carrega o ator autenticado (perfil + cargos). Base para checagens no servidor.
export async function getAtor(): Promise<Ator | null> {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nome,email,ambiente_principal,secretaria_id,unidade_id,grafica_id")
    .eq("id", user.id).single();
  const { data: cargosRows } = await supabase
    .from("usuario_cargos").select("cargos(chave)").eq("usuario_id", user.id);
  const cargos = (cargosRows ?? []).map((r: any) => r.cargos.chave as CargoChave);
  return {
    id: user.id, nome: perfil?.nome ?? "Usuário", email: perfil?.email ?? user.email ?? "",
    cargos, ambiente: (perfil?.ambiente_principal ?? "interno"),
    secretariaId: perfil?.secretaria_id ?? null, unidadeId: perfil?.unidade_id ?? null, graficaId: perfil?.grafica_id ?? null,
  };
}
