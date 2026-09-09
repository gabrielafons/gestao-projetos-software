/**
 * Leitura centralizada e validada das variaveis de ambiente.
 *
 * A leitura e preguicosa (dentro de funcoes) de proposito: se fosse avaliada
 * no topo do modulo, o `next build` quebraria em qualquer maquina sem as
 * chaves — inclusive na CI. Assim, a ausencia de uma variavel falha no momento
 * em que ela e de fato necessaria, com uma mensagem que diz o que fazer.
 *
 * As referencias a `process.env.NEXT_PUBLIC_*` sao literais porque o Next
 * substitui esses trechos em tempo de build para expo-las ao navegador.
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
