import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

/** Rotas que exigem sessao aberta. */
const ROTAS_PROTEGIDAS = ["/painel", "/meus-convites", "/operacao"];

/**
 * Renova a sessao a cada requisicao e barra o acesso as rotas protegidas.
 *
 * O token do Supabase expira; sem esta renovacao o usuario seria deslogado no
 * meio do uso. A resposta precisa carregar os cookies atualizados, por isso ela
 * e reconstruida dentro de `setAll`.
 */
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const env = envPublico();

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaDefinir) {
          for (const { name, value } of cookiesParaDefinir) {
            request.cookies.set(name, value);
          }

          resposta = NextResponse.next({ request });

          for (const { name, value, options } of cookiesParaDefinir) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const exigeSessao = ROTAS_PROTEGIDAS.some((rota) => caminho.startsWith(rota));

  if (!user && exigeSessao) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    // Guarda o caminho pedido para devolver a pessoa a ele depois do login.
    destino.searchParams.set("continuar", caminho);
    return NextResponse.redirect(destino);
  }

  return resposta;
}
