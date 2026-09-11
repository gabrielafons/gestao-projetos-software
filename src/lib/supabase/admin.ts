import "server-only";

import { createClient } from "@supabase/supabase-js";

import { envPrivado, envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente administrativo do Supabase.
 *
 * Usa a chave de servico e IGNORA as policies de RLS. Serve para operacoes que
 * precisam acontecer antes de existir uma sessao — como o cadastro, que cria o
 * usuario no Auth e grava o perfil na mesma operacao.
 *
 * O import de `server-only` garante, em tempo de build, que este modulo nunca
 * seja arrastado para o bundle do navegador.
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
