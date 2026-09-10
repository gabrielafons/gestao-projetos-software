import { z } from "zod";

import { cpfEhValido, normalizarCpf } from "@/lib/validators/cpf";
import {
  normalizarNome,
  nomeCompletoEhValido,
  TAMANHO_MAXIMO_NOME,
} from "@/lib/validators/nome";
import {
  REQUISITOS_SENHA,
  TAMANHO_MAXIMO_SENHA,
} from "@/lib/validators/senha";
import {
  normalizarTelefone,
  telefoneEhValido,
} from "@/lib/validators/telefone";

/** Limite de um endereco de e-mail pela RFC 5321. */
export const TAMANHO_MAXIMO_EMAIL = 254;

/**
 * UH 01 - T3 - Validador dos dados obrigatorios do cadastro de organizador.
 *
 * Importado pelo formulario e pelo endpoint, para que a mensagem exibida na
 * tela seja a mesma regra aplicada no servidor.
 */
export const schemaCadastroOrganizador = z.object({
  nome: z
    .string()
    .min(1, "Informe o nome completo.")
    .transform(normalizarNome)
    .refine(
      (nome) => nome.length <= TAMANHO_MAXIMO_NOME,
      `O nome deve ter no maximo ${TAMANHO_MAXIMO_NOME} caracteres.`,
    )
    .refine(nomeCompletoEhValido, "Informe nome e sobrenome."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe o e-mail.")
    .max(
      TAMANHO_MAXIMO_EMAIL,
      `O e-mail deve ter no maximo ${TAMANHO_MAXIMO_EMAIL} caracteres.`,
    )
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
    .min(1, "Informe a senha.")
    .max(
      TAMANHO_MAXIMO_SENHA,
      `A senha deve ter no maximo ${TAMANHO_MAXIMO_SENHA} caracteres.`,
    )
    .superRefine((senha, ctx) => {
      // Um problema por requisito nao atendido, para a tela conseguir dizer
      // exatamente o que falta em vez de "senha fraca".
      for (const requisito of REQUISITOS_SENHA) {
        if (!requisito.atende(senha)) {
          ctx.addIssue({
            code: "custom",
            message: `A senha precisa de: ${requisito.texto.toLowerCase()}.`,
          });
        }
      }
    }),
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

/**
 * Valida um campo isoladamente, para o formulario dar retorno enquanto a
 * pessoa preenche — sem esperar o envio.
 *
 * Retorna a primeira mensagem pendente, ou `undefined` se o campo esta valido.
 */
export function validarCampo(
  campo: keyof EntradaCadastroOrganizador,
  valor: string,
): string | undefined {
  const resultado = schemaCadastroOrganizador.shape[campo].safeParse(valor);
  return resultado.success ? undefined : resultado.error.issues[0]?.message;
}
