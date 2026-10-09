import { NextResponse } from "next/server";
import { executarHttp, idValido } from "@/lib/http";
import { recuperarEmail } from "@/lib/services/convites";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "recuperar-confirmacao", 10);
    return NextResponse.json(
      await recuperarEmail(idValido((await params).id), "confirmacao"),
    );
  });
}
