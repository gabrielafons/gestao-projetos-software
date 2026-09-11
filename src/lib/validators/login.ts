import { z } from "zod";

import { TAMANHO_MAXIMO_EMAIL } from "@/lib/validators/organizador";

/**
 * UH 04 - Dados do login por e-mail e senha.
 *
 * A senha aqui so e conferida quanto a presenca: quem julga se ela esta certa
 * e o Supabase Auth. Aplicar as regras de senha forte neste ponto vazaria o
 * formato esperado e ainda barraria quem se cadastrou antes de a regra mudar.
 */
export const schemaLogin = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe o e-mail.")
    .max(TAMANHO_MAXIMO_EMAIL, "E-mail longo demais.")
    .pipe(z.email("Informe um e-mail valido.")),

  senha: z.string().min(1, "Informe a senha."),
});

export type DadosLogin = z.infer<typeof schemaLogin>;

export type ErrosLogin = Partial<Record<keyof DadosLogin, string>>;

export function extrairErrosLogin(erro: z.ZodError): ErrosLogin {
  const erros: ErrosLogin = {};

  for (const problema of erro.issues) {
    const campo = problema.path[0] as keyof DadosLogin;
    if (campo && !erros[campo]) erros[campo] = problema.message;
  }

  return erros;
}
