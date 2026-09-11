import { createBrowserClient } from "@supabase/ssr";

import { envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso no navegador (Client Components).
 *
 * Usa a chave anonima e, portanto, esta sujeito as policies de RLS definidas
 * nas migrations: cada usuario so alcanca os proprios dados.
 */
export function criarClienteNavegador() {
  const env = envPublico();

  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
