import { NextResponse } from "next/server";
import { executarHttp, lerCorpo } from "@/lib/http";
import { schemaCadastroConvidado } from "@/lib/validators/convidado";
import { cadastrarConvidado } from "@/lib/services/convites";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function POST(request: Request) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "cadastro-convidado");
    const convidado = await cadastrarConvidado(
      await lerCorpo(request, schemaCadastroConvidado),
    );
    return NextResponse.json(
      { convidado, destino: "/meus-convites" },
      { status: 201 },
    );
  });
}
