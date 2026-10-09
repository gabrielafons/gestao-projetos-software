import { NextResponse } from "next/server";
import { executarHttp, lerCorpo } from "@/lib/http";
import { schemaEmissaoConvite } from "@/lib/validators/convite";
import { emitirConvite } from "@/lib/services/convites";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function POST(request: Request) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "convites", 60);
    return NextResponse.json(
      await emitirConvite(await lerCorpo(request, schemaEmissaoConvite)),
      { status: 201 },
    );
  });
}
