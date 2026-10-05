import { NextResponse } from "next/server";
import { z } from "zod";
import { executarHttp, lerCorpo } from "@/lib/http";
import { schemaToken } from "@/lib/validators/convidado";
import { solicitarAcesso } from "@/lib/services/convites";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function POST(request: Request) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "acesso", 10);
    const { token } = await lerCorpo(
      request,
      z.object({ token: schemaToken }).strict(),
    );
    await solicitarAcesso(token);
    return NextResponse.json({
      mensagem:
        "Enviamos o link de acesso para o e-mail do convite. Verifique sua caixa de entrada.",
    });
  });
}
