import { NextResponse } from "next/server";
import { executarHttp, lerCorpo } from "@/lib/http";
import { schemaEvento } from "@/lib/validators/evento";
import { criarEvento, listarEventos } from "@/lib/services/eventos";
import { limitarSolicitacao } from "@/lib/services/limites";
export async function GET() {
  return executarHttp(async () =>
    NextResponse.json({ eventos: await listarEventos() }),
  );
}
export async function POST(request: Request) {
  return executarHttp(async () => {
    await limitarSolicitacao(request, "eventos");
    return NextResponse.json(
      { evento: await criarEvento(await lerCorpo(request, schemaEvento)) },
      { status: 201 },
    );
  });
}
