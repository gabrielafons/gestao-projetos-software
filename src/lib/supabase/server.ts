import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso no servidor (Server Components, Route Handlers
 * e Server Actions), com a sessao do usuario lida dos cookies.
 *
 * Continua usando a chave anonima: as policies de RLS valem igualmente aqui.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();
  const env = envPublico();

  return createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaDefinir) {
          try {
            for (const { name, value, options } of cookiesParaDefinir) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components nao podem escrever cookies. Quando a renovacao
            // da sessao acontece em um deles, o erro e esperado e pode ser
            // ignorado: o middleware ja cuida de renovar o token.
          }
        },
      },
    },
  );
}
