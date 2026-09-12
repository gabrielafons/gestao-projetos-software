/**
 * UH 04 - T3 - Perfis de acesso.
 *
 * O perfil fica nos metadados do usuario no Supabase Auth, gravado no
 * cadastro, e e o que decide o que cada pessoa alcanca depois de entrar.
 */
export const PERFIS = ["organizador", "convidado", "operador"] as const;

export type Perfil = (typeof PERFIS)[number];

/** Para onde cada perfil vai ao entrar. */
export const ROTA_INICIAL: Record<Perfil, string> = {
  organizador: "/painel",
  convidado: "/meus-convites",
  operador: "/operacao",
};

export function ehPerfil(valor: unknown): valor is Perfil {
  return typeof valor === "string" && PERFIS.includes(valor as Perfil);
}

/** Le o perfil dos metadados do usuario, sem confiar no formato do que vem. */
export function lerPerfil(metadados: unknown): Perfil | null {
  if (!metadados || typeof metadados !== "object") return null;

  const perfil = (metadados as Record<string, unknown>).perfil;
  return ehPerfil(perfil) ? perfil : null;
}
