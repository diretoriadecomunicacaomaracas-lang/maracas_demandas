import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
// Troca o código de convite/recuperação por sessão e redireciona.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/", req.url));
}
