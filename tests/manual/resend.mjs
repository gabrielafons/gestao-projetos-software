// Execução explícita: três mensagens somente no simulador oficial Resend.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
const origem = process.env.APP_URL;
if (
  !["http://localhost:3100", "http://127.0.0.1:3100"].includes(origem) ||
  !["http://localhost:55431", "http://127.0.0.1:55431"].includes(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ) ||
  process.env.EMAIL_TRANSPORT !== "resend"
)
  throw new Error("Smoke exige Evently local e transporte Resend explícito.");
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const resend = new Resend(process.env.RESEND_API_KEY),
  tag = randomBytes(5).toString("hex"),
  destinatario = `delivered+evently-${tag}@resend.dev`,
  senha = "Evently@Test2026",
  ids = [];
const cpf = () => {
  const n = Array.from(randomBytes(9), (x) => x % 10);
  for (let size = 9; size <= 10; size++) {
    const d = (n.reduce((s, v, i) => s + v * (size + 1 - i), 0) * 10) % 11;
    n.push(d === 10 ? 0 : d);
  }
  return n.join("");
};
async function request(path, data, cookies = "", method = "POST") {
  const r = await fetch(origem + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: origem,
      Cookie: cookies,
      "X-Forwarded-For": `test-resend-${tag}`,
    },
    body: JSON.stringify(data),
  });
  const body = await r.json();
  assert.ok(
    r.ok,
    `HTTP ${r.status}: ${body.codigo ?? body.mensagem ?? "falha"}`,
  );
  return {
    body,
    cookies: r.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; "),
  };
}
async function notificacao(id, tipo) {
  const r = await admin
    .from("notificacoes")
    .select("id,estado,provedor_id")
    .eq("convite_id", id)
    .eq("tipo", tipo)
    .order("id", { ascending: false })
    .limit(1)
    .single();
  assert.ifError(r.error);
  assert.equal(r.data.estado, "enviado");
  const m = await resend.emails.get(r.data.provedor_id);
  assert.ifError(m.error);
  assert.equal(m.data.to[0], destinatario);
  return m.data;
}
try {
  const org = await request("/api/organizadores", {
    nome: "Ana Organizadora",
    email: `resend-org-${tag}@example.test`,
    cpf: cpf(),
    telefone: "11987654321",
    senha,
  });
  ids.push(org.body.organizador.id);
  const auth = await request("/api/sessao", {
    email: `resend-org-${tag}@example.test`,
    senha,
  });
  const evento = await request(
    "/api/eventos",
    {
      nome: "Validação Resend Sprint 1",
      data: "2027-12-01",
      horario: "10:00",
      local: "Auditório de homologação",
    },
    auth.cookies,
  );
  const convite = await request(
    "/api/convites",
    {
      evento_id: evento.body.evento.id,
      nome_convidado: "Maria da Silva",
      email: destinatario,
      cpf: cpf(),
      telefone: "11987654321",
    },
    auth.cookies,
  );
  assert.equal(convite.body.envio_status, "enviado");
  const id = convite.body.convite.id;
  const emailConvite = await notificacao(id, "convite");
  const token = emailConvite.html.match(/\/convite\/([a-f0-9]{64})/)[1];
  assert.ok(emailConvite.html.includes("Auditório de homologação"));
  await request("/api/convites/acesso", { token });
  const emailAcesso = await notificacao(id, "acesso");
  const link = emailAcesso.html
    .match(/http:\/\/localhost:3100\/auth\/confirm\?[^"<> ]+/)[0]
    .replaceAll("&amp;", "&");
  const params = new URL(link).searchParams;
  const guestAuth = await request("/api/sessao/convite", {
    token_hash: params.get("token_hash"),
    convite: params.get("convite"),
  });
  const profile = await request(
    "/api/convidados",
    {
      nome: "Maria da Silva",
      email: destinatario,
      cpf: cpf(),
      telefone: "11987654321",
      token,
    },
    guestAuth.cookies,
  );
  ids.push(profile.body.convidado.id);
  const resposta = await request(
    `/api/convites/${id}`,
    { status: "confirmado" },
    guestAuth.cookies,
    "PATCH",
  );
  assert.equal(resposta.body.confirmacao_envio_status, "enviado");
  const emailConfirmacao = await notificacao(id, "confirmacao");
  await request(
    `/api/convites/${id}`,
    { status: "confirmado" },
    guestAuth.cookies,
    "PATCH",
  );
  const { data } = await admin
    .from("notificacoes")
    .select("id")
    .eq("convite_id", id)
    .eq("tipo", "confirmacao");
  assert.equal(data.length, 1);
  console.log(
    JSON.stringify({
      resultado: "aprovado",
      destino: "simulador-oficial-resend",
      mensagens: [emailConvite, emailAcesso, emailConfirmacao].map((m) => ({
        id: m.id,
        status: m.last_event,
        assunto: m.subject,
      })),
    }),
  );
} finally {
  const users = await admin.auth.admin.listUsers({ perPage: 1000 });
  const guest = users.data.users.find((u) => u.email === destinatario);
  if (guest && !ids.includes(guest.id)) ids.push(guest.id);
  for (const id of ids)
    assert.ifError((await admin.auth.admin.deleteUser(id)).error);
}
