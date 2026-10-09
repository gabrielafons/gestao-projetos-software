import { z } from "zod";
import { schemaCadastroOrganizador } from "./organizador";
export const schemaToken = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Convite inválido.");
export const schemaCadastroConvidado = schemaCadastroOrganizador
  .omit({ senha: true })
  .extend({ token: schemaToken })
  .strict();
export type DadosConvidado = z.infer<typeof schemaCadastroConvidado>;
