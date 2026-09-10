/**
 * Requisitos de senha forte.
 *
 * A lista e a fonte unica: o schema de cadastro valida contra ela e a tela
 * exibe os mesmos itens, marcando cada um conforme a pessoa digita.
 */
export const REQUISITOS_SENHA = [
  {
    id: "tamanho",
    texto: "Ao menos 8 caracteres",
    atende: (senha: string) => senha.length >= 8,
  },
  {
    id: "maiuscula",
    texto: "Uma letra maiuscula",
    atende: (senha: string) => /[A-Z]/.test(senha),
  },
  {
    id: "minuscula",
    texto: "Uma letra minuscula",
    atende: (senha: string) => /[a-z]/.test(senha),
  },
  {
    id: "numero",
    texto: "Um numero",
    atende: (senha: string) => /[0-9]/.test(senha),
  },
  {
    id: "simbolo",
    texto: "Um simbolo (!@#$...)",
    atende: (senha: string) => /[^A-Za-z0-9]/.test(senha),
  },
] as const;

export type RequisitoSenha = (typeof REQUISITOS_SENHA)[number];

/** Limite do bcrypt, usado pelo Supabase Auth: acima disso a senha e truncada. */
export const TAMANHO_MAXIMO_SENHA = 72;

/** Situacao de cada requisito para a senha informada. */
export function avaliarSenha(senha: string) {
  return REQUISITOS_SENHA.map((requisito) => ({
    id: requisito.id,
    texto: requisito.texto,
    atendido: requisito.atende(senha),
  }));
}

export function senhaEhForte(senha: string): boolean {
  return (
    senha.length <= TAMANHO_MAXIMO_SENHA &&
    REQUISITOS_SENHA.every((requisito) => requisito.atende(senha))
  );
}
