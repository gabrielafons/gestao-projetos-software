import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { envAplicacao } from "@/lib/env";
import { hashToken } from "./tokens";
import { falhaBanco, FalhaOperacao } from "./erros";
export async function limitarSolicitacao(
  request: Request,
  escopo: string,
  limite = 30,
) {
  const origem = request.headers.get("origin");
  if (origem && origem !== envAplicacao())
    throw new FalhaOperacao(
      "ORIGEM_INVALIDA",
      403,
      "Origem da solicitação inválida.",
    );
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const { data, error } = await criarClienteAdmin().rpc("consumir_limite", {
    p_chave: `http:${escopo}:${hashToken(ip)}`,
    p_limite: limite,
    p_segundos: 300,
  });
  falhaBanco(error);
  if (!data)
    throw new FalhaOperacao(
      "LIMITE",
      429,
      "Muitas tentativas. Aguarde alguns minutos.",
    );
}
