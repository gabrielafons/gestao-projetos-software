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

export function envAplicacao() {
  const url = new URL(obrigatoria("APP_URL", process.env.APP_URL));
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error("APP_URL deve ser a origem da aplicação.");
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("APP_URL deve usar HTTPS.");
  return url.origin;
}
export function envEmail() {
  const transporte = process.env.EMAIL_TRANSPORT ?? "resend";
  if (transporte === "local") {
    const url = new URL(
      obrigatoria("EMAIL_LOCAL_URL", process.env.EMAIL_LOCAL_URL),
    );
    const app = new URL(envAplicacao());
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      !["127.0.0.1", "localhost"].includes(app.hostname) ||
      process.env.ALLOW_LOCAL_EMAIL !== "true"
    )
      throw new Error(
        "Transporte local disponível apenas em homologação local.",
      );
    return { transporte: "local" as const, url: url.origin };
  }
  if (transporte !== "resend") throw new Error("EMAIL_TRANSPORT inválido.");
  return {
    transporte: "resend" as const,
    apiKey: obrigatoria("RESEND_API_KEY", process.env.RESEND_API_KEY),
    remetente: obrigatoria("EMAIL_FROM", process.env.EMAIL_FROM),
  };
}
