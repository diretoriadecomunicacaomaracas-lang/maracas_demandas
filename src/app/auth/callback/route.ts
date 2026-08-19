import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
// Troca o código de convite/recuperação por sessão e redireciona ao destino seguro.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  // Só aceita destino interno (evita open redirect).
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (code) {
    const supabase = createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?erro=link", req.url));
  }
  return NextResponse.redirect(new URL(destino, req.url));
}
