// Seleciona a fonte de dados por variável de ambiente.
// - DATA_SOURCE=memory (padrão em dev local): store em memória com seed fictício, SEM credenciais.
// - DATA_SOURCE=supabase: usa Supabase (requer variáveis de ambiente) — integração das próximas fases.
import { seedStore } from "@/domain/seed";
import type { Store } from "@/domain/store";

let _mem: { db: Store; atores: ReturnType<typeof seedStore>["atores"] } | null = null;
export function memoria() { if (!_mem) _mem = seedStore(); return _mem; }
export const fonteDados = () => process.env.DATA_SOURCE ?? "memory";
