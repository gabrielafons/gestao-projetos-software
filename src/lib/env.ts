/**
 * Leitura validada das variaveis de ambiente.
 *
 * A leitura fica dentro das funcoes para nao quebrar o build em maquinas sem
 * as chaves configuradas. As referencias a `process.env.NEXT_PUBLIC_*` sao
 * literais porque o Next as substitui em tempo de build.
 */

function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor || valor.trim() === "") {
    throw new Error(
      `Variavel de ambiente ausente: ${nome}. ` +
        `Copie o arquivo .env.example para .env.local e preencha os valores.`,
    );
  }
  return valor;
}

/** Configuracao publica: pode ser lida pelo navegador. */
export function envPublico() {
  return {
    supabaseUrl: obrigatoria(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    supabaseAnonKey: obrigatoria(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

/** Configuracao privada: nunca deve ser lida fora do servidor. */
export function envPrivado() {
  return {
    supabaseServiceRoleKey: obrigatoria(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
