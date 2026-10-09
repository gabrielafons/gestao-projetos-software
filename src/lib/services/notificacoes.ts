import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarNotificacao } from "@/lib/email/enviar";
import { falhaBanco } from "./erros";
export async function estadoEnvio(
  conviteId: number,
  tipo: "convite" | "confirmacao" | "acesso" = "convite",
) {
  const db = criarClienteAdmin();
  const { data, error } = await db
    .from("notificacoes")
    .select("estado")
    .eq("convite_id", conviteId)
    .eq("tipo", tipo)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  falhaBanco(error);
  return data?.estado ?? null;
}
export async function processarNotificacoes(conviteId?: number) {
  const db = criarClienteAdmin();
  const { data, error } = await db.rpc("claim_notificacoes", {
    p_limite: 5,
    ...(conviteId ? { p_convite: conviteId } : {}),
  });
  falhaBanco(error);
  const resultados: { id: number; estado: string }[] = [];
  for (const notificacao of data ?? []) {
    try {
      const id = await enviarNotificacao(notificacao);
      const { error: save } = await db
        .from("notificacoes")
        .update({
          estado: "enviado",
          provedor_id: id,
          ultimo_erro: null,
          lease: null,
          lease_ate: null,
        })
        .eq("id", notificacao.id)
        .eq("lease", notificacao.lease!);
      falhaBanco(save);
      resultados.push({ id: notificacao.id, estado: "enviado" });
    } catch {
      const { error: save } = await db
        .from("notificacoes")
        .update({
          estado: "falhou",
          ultimo_erro:
            "Não foi possível enviar o e-mail. Verifique a configuração e tente novamente.",
          lease: null,
          lease_ate: null,
          proxima_tentativa: new Date(
            Date.now() + Math.min(3600, 2 ** notificacao.tentativas) * 1000,
          ).toISOString(),
        })
        .eq("id", notificacao.id)
        .eq("lease", notificacao.lease!);
      falhaBanco(save);
      resultados.push({ id: notificacao.id, estado: "falhou" });
    }
  }
  return resultados;
}
