import { NextResponse } from "next/server";
import { z } from "zod";
import { executarHttp, lerCorpo } from "@/lib/http";
import { schemaToken } from "@/lib/validators/convidado";
import { confirmarAcesso } from "@/lib/services/convites";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function POST(request: Request) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "verificar-acesso", 20);
    const dados = await lerCorpo(
      request,
      z
        .object({
          token_hash: z.string().regex(/^[a-f0-9]{56,64}$/),
          convite: schemaToken,
        })
        .strict(),
    );
    return NextResponse.json({
      destino: await confirmarAcesso(dados.token_hash, dados.convite),
    });
  });
}
