import type { NextRequest } from "next/server";

import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  // Apenas as rotas com sessao: assim as paginas publicas (home, cadastro)
  // continuam servidas sem depender das chaves do Supabase.
  matcher: ["/painel/:path*", "/meus-convites/:path*", "/operacao/:path*"],
};
