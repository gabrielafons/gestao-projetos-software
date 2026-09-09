import { z } from "zod";

import { cpfEhValido, normalizarCpf } from "@/lib/validators/cpf";
import {
  normalizarTelefone,
  telefoneEhValido,
} from "@/lib/validators/telefone";

/**
 * UH 01 - T3 - Validador dos dados obrigatorios do cadastro de organizador.
 *
 * Este schema e o unico lugar onde a regra vive: o formulario (UI) e o endpoint
 * (API) importam daqui. Assim a mensagem que o usuario ve na tela e exatamente
 * a mesma que o servidor aplicaria — a validacao do cliente e conveniencia, a
 * do servidor e a que vale.
 *
 * Campos definidos no card UH 01 - T4: nome, e-mail, telefone, senha, CPF.
 */
export const schemaCadastroOrganizador = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo (ao menos 3 caracteres).")
    .max(120, "O nome deve ter no maximo 120 caracteres."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe o e-mail.")
    .pipe(z.email("Informe um e-mail valido.")),

  cpf: z
    .string()
    .min(1, "Informe o CPF.")
    .transform(normalizarCpf)
    .refine(cpfEhValido, "CPF invalido. Confira os digitos."),

  telefone: z
    .string()
    .min(1, "Informe o telefone.")
    .transform(normalizarTelefone)
    .refine(telefoneEhValido, "Informe um telefone com DDD."),

  senha: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres.")
    .max(72, "A senha deve ter no maximo 72 caracteres.")
    .refine(
      (senha) => /[A-Za-z]/.test(senha) && /[0-9]/.test(senha),
      "A senha deve combinar letras e numeros.",
    ),
});

/** Dados ja validados e normalizados, prontos para ir ao banco. */
export type DadosCadastroOrganizador = z.infer<
  typeof schemaCadastroOrganizador
>;

/** O que o formulario envia, antes da normalizacao. */
export type EntradaCadastroOrganizador = z.input<
  typeof schemaCadastroOrganizador
>;

/** Erros por campo, no formato que o formulario consome diretamente. */
export type ErrosPorCampo = Partial<
  Record<keyof EntradaCadastroOrganizador, string>
>;

/**
 * Converte o erro do Zod em um mapa `campo -> primeira mensagem`.
 *
 * O formulario mostra um erro por campo; guardar a lista inteira so
 * empilharia mensagens redundantes embaixo do mesmo input.
 */
export function extrairErrosPorCampo(erro: z.ZodError): ErrosPorCampo {
  const erros: ErrosPorCampo = {};

  for (const problema of erro.issues) {
    const campo = problema.path[0] as keyof EntradaCadastroOrganizador;
    if (campo && !erros[campo]) {
      erros[campo] = problema.message;
    }
  }

  return erros;
}
