import { NextResponse } from "next/server";
import { executarHttp, lerCorpo, idValido } from "@/lib/http";
import { schemaRespostaConvite } from "@/lib/validators/resposta-convite";
import { responderConvite } from "@/lib/services/convites";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "resposta");
    const dados = await lerCorpo(request, schemaRespostaConvite);
    return NextResponse.json(
      await responderConvite(idValido((await params).id), dados.status),
    );
  });
}
