import { z } from "zod";
export const schemaRespostaConvite = z
  .object({ status: z.enum(["confirmado", "recusado"]) })
  .strict();
