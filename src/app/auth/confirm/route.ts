import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

// Confirmação server-side de convite/recuperação via token_hash (padrão oficial
// do Supabase, sem depender de PKCE/code). Valida com verifyOtp, cria a sessão
// nos cookies e só então redireciona para o destino (ex.: /ativar).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next");
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (token_hash && type) {
    const supabase = createSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(destino, req.url));
  }
  // Sem sessão válida → cai em /ativar, que mostra "convite inválido ou expirado".
  return NextResponse.redirect(new URL("/ativar", req.url));
}
