import { z } from "zod";
export const schemaEvento = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "Informe o nome do evento.")
      .max(150, "Use até 150 caracteres."),
    data: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
      .refine((v) => {
        const d = new Date(`${v}T12:00:00Z`);
        return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v;
      }, "Informe uma data válida."),
    horario: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
        "Informe um horário válido.",
      ),
    local: z
      .string()
      .trim()
      .min(3, "Informe o local do evento.")
      .max(300, "Use até 300 caracteres."),
  })
  .strict();
export type DadosEvento = z.infer<typeof schemaEvento>;
