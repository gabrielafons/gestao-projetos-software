import { NextResponse } from "next/server";
import { executarHttp, idValido } from "@/lib/http";
import { reenviarConvite } from "@/lib/services/convites";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "reenviar", 10);
    return NextResponse.json(
      await reenviarConvite(idValido((await params).id)),
    );
  });
}
