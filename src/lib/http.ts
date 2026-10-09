import { NextResponse } from "next/server";
import { z } from "zod";
import { FalhaOperacao } from "./services/erros";
export async function lerCorpo<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const texto = await request.text();
  if (texto.length > 16384)
    throw new FalhaOperacao(
      "CORPO_GRANDE",
      413,
      "A solicitação é muito grande.",
    );
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new FalhaOperacao(
      "JSON_INVALIDO",
      400,
      "Corpo da solicitação inválido.",
    );
  }
  return schema.parse(json);
}
export async function executarHttp(
  acao: () => Promise<Response>,
): Promise<Response> {
  try {
    const resposta = await acao();
    resposta.headers.set("Cache-Control", "private, no-store");
    resposta.headers.set("Referrer-Policy", "no-referrer");
    return resposta;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const erros: Record<string, string> = {};
      for (const issue of error.issues) {
        const campo = String(issue.path[0] ?? "dados");
        erros[campo] ??= issue.message;
      }
      return NextResponse.json(
        { mensagem: "Verifique os campos destacados.", erros },
        { status: 400 },
      );
    }
    if (error instanceof FalhaOperacao)
      return NextResponse.json(
        { mensagem: error.message, codigo: error.codigo },
        { status: error.status },
      );
    console.error(
      "[evently] operação indisponível",
      error instanceof Error ? error.name : "Erro",
    );
    return NextResponse.json(
      {
        mensagem: "Serviço indisponível. Tente novamente em instantes.",
        codigo: "SERVICO_INDISPONIVEL",
      },
      { status: 503 },
    );
  }
}
export function idValido(valor: string) {
  const n = Number(valor);
  if (!Number.isSafeInteger(n) || n < 1)
    throw new FalhaOperacao("NAO_ENCONTRADO", 404, "Registro não encontrado.");
  return n;
}
