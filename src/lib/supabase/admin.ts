import "server-only";

import { createClient } from "@supabase/supabase-js";

import { envPrivado, envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente administrativo: usa a chave de servico e ignora as policies de RLS.
 *
 * Restrito as operacoes anteriores a existencia de uma sessao, como o cadastro.
 * O import de `server-only` impede que chegue ao bundle do navegador.
 */
export function criarClienteAdmin() {
  return createClient<Database>(
    envPublico().supabaseUrl,
    envPrivado().supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
