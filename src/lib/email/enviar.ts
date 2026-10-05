import "server-only";
import { createElement } from "react";
import { render, toPlainText } from "@react-email/render";
import { Resend } from "resend";
import { envEmail, envAplicacao } from "@/lib/env";
import { Mensagem } from "@/emails/mensagem";
import { EmailConvite } from "@/emails/convite";
import { EmailConfirmacao } from "@/emails/confirmacao";
import type { Notificacao } from "@/types/database";
export async function enviarNotificacao(n: Notificacao) {
  const origem = envAplicacao();
  const p = n.payload;
  const props = {
    nome: p.nome,
    evento: p.evento,
    data: p.data,
    horario: p.horario,
    local: p.local,
  };
  const link =
    n.tipo === "convite"
      ? `${origem}/convite/${p.token}`
      : n.tipo === "acesso"
        ? `${origem}/auth/confirm?${new URLSearchParams({ token_hash: p.token_hash, convite: p.token })}`
        : undefined;
  if (n.tipo === "acesso" && Date.now() - Number(p.gerado_em) > 50 * 60 * 1000)
    throw new Error("LINK_EXPIRADO");
  const titulo =
    n.tipo === "convite"
      ? "Você recebeu um convite"
      : n.tipo === "confirmacao"
        ? "Sua presença está confirmada"
        : "Confirme seu acesso ao Evently";
  const componente =
    n.tipo === "convite"
      ? createElement(EmailConvite, { ...props, link })
      : n.tipo === "confirmacao"
        ? createElement(EmailConfirmacao, props)
        : createElement(Mensagem, {
            ...props,
            titulo,
            link,
            acao: "Confirmar acesso",
          });
  const html = await render(componente);
  const text = toPlainText(html);
  const conf = envEmail();
  if (conf.transporte === "local") {
    const response = await fetch(`${conf.url}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: "evently@example.test", Name: "Evently" },
        To: [{ Email: n.destinatario }],
        Subject: `${titulo} — ${p.evento}`,
        HTML: html,
        Text: text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("ENVIO_INDISPONIVEL");
    const data = await response.json();
    return String(data.ID ?? data.id);
  }
  const { data, error } = await new Resend(conf.apiKey).emails.send(
    {
      from: conf.remetente,
      to: n.destinatario,
      subject: `${titulo} — ${p.evento}`,
      html,
      text,
    },
    { idempotencyKey: n.chave, signal: AbortSignal.timeout(15000) },
  );
  if (error || !data?.id) throw new Error("ENVIO_INDISPONIVEL");
  return data.id;
}
