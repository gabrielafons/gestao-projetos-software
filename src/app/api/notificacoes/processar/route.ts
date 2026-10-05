import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { executarHttp } from "@/lib/http";
import { processarNotificacoes } from "@/lib/services/notificacoes";
import { FalhaOperacao } from "@/lib/services/erros";
export const maxDuration = 120;
export async function POST(request: Request) {
  return executarHttp(async () => {
    const recebido = Buffer.from(request.headers.get("authorization") ?? "");
    const token = process.env.NOTIFICATION_WORKER_TOKEN;
    if (!token || token.length < 32)
      throw new FalhaOperacao(
        "WORKER_DESATIVADO",
        503,
        "Processador não configurado.",
      );
    const esperado = Buffer.from(`Bearer ${token}`);
    if (
      recebido.length !== esperado.length ||
      !timingSafeEqual(recebido, esperado)
    )
      throw new FalhaOperacao("SEM_PERMISSAO", 401, "Acesso não autorizado.");
    return NextResponse.json({ resultados: await processarNotificacoes() });
  });
}
