import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Protege rotas por ambiente. O usuário só acessa o ambiente do seu login/permissões.
// Não existe seletor público para trocar de ambiente (removido do protótipo de demonstração).
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => req.cookies.get(n)?.value,
        set: (n: string, v: string, o: CookieOptions) => res.cookies.set({ name: n, value: v, ...o }),
        remove: (n: string, o: CookieOptions) => res.cookies.set({ name: n, value: "", ...o }),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const publicPaths = ["/login", "/ativar", "/recuperar", "/redefinir", "/convite-expirado", "/auth"];
  const isPublic = publicPaths.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (user && (path === "/" || path === "/login")) {
    // ambiente_principal define o destino; a checagem fina fica nas rotas + RLS.
    const { data: perfil } = await supabase.from("usuarios").select("ambiente_principal").eq("id", user.id).single();
    const dest = perfil?.ambiente_principal === "solicitante" ? "/portal"
      : perfil?.ambiente_principal === "grafica" ? "/grafica" : "/app/painel";
    return NextResponse.redirect(new URL(dest, req.url));
  }
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|fonts).*)"] };
