import { z } from "zod";
import { schemaCadastroOrganizador } from "./organizador";
export const schemaEmissaoConvite = z
  .object({
    evento_id: z.number().int().positive(),
    nome_convidado: schemaCadastroOrganizador.shape.nome,
    email: schemaCadastroOrganizador.shape.email,
    cpf: schemaCadastroOrganizador.shape.cpf,
    telefone: schemaCadastroOrganizador.shape.telefone,
  })
  .strict();
export type DadosEmissaoConvite = z.infer<typeof schemaEmissaoConvite>;
export { schemaCadastroConvidado } from "./convidado";
export { schemaRespostaConvite } from "./resposta-convite";
