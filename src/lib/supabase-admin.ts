import { createClient } from "@supabase/supabase-js";
// Cliente ADMIN (service_role). USO EXCLUSIVO NO SERVIDOR. Nunca importar em componentes client.
export function createSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente — configure no ambiente do servidor.");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
