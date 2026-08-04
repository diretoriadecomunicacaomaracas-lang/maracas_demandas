"use client";
import { createBrowserClient } from "@supabase/ssr";
// Cliente para componentes client-side. Usa apenas a chave pública (anon).
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
