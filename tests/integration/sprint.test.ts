import { before, after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!["http://localhost:55431", "http://127.0.0.1:55431"].includes(url))
  throw new Error("Integração exige Supabase Evently local dedicado.");
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = () =>
  createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const sql = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:55432/postgres",
});
const senha = "Evently@Test2026",
  tag = randomBytes(6).toString("hex"),
  users: string[] = [];
let orgA: string,
  orgB: string,
  guest: string,
  guest2: string,
  event: number,
  invite: number,
  token: string,
  guestSession: string,
  passwordSession: string,
  otherSession: string;
let clientA: ReturnType<typeof anon>,
  clientB: ReturnType<typeof anon>,
  clientGuest: ReturnType<typeof anon>,
  passwordGuest: ReturnType<typeof anon>;
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
async function user(name: string, perfil?: string) {
  const email = `${name}-${tag}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { perfil: perfil ?? "convidado" },
  });
  assert.ifError(error);
  users.push(data.user!.id);
  return { id: data.user!.id, email };
}
async function login(email: string) {
  const c = anon();
  assert.ifError(
    (await c.auth.signInWithPassword({ email, password: senha })).error,
  );
  return c;
}
async function session(c: ReturnType<typeof anon>) {
  const r = await c.auth.getClaims();
  assert.ifError(r.error);
  return String(r.data!.claims.session_id);
}
async function proof(
  c: ReturnType<typeof anon>,
  email: string,
  id: string,
  invitation: number,
) {
  const link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  assert.ifError(link.error);
  assert.ifError(
    (
      await c.auth.verifyOtp({
        type: "email",
        token_hash: link.data.properties!.hashed_token,
      })
    ).error,
  );
  const sid = await session(c);
  assert.ifError(
    (
      await admin.rpc("registrar_prova_postal", {
        p_usuario: id,
        p_sessao: sid,
        p_convite: invitation,
      })
    ).error,
  );
  return sid;
}
async function emit(email: string, overrides: Record<string, unknown> = {}) {
  const tok = randomBytes(32).toString("hex");
  const { data, error } = await admin.rpc("emitir_convite", {
    p_organizador: orgA,
    p_evento: event,
    p_nome: "Maria da Silva",
    p_email: email,
    p_cpf: "52998224725",
    p_telefone: "11987654321",
    p_codigo: randomUUID(),
    p_token_hash: hash(tok),
    p_token: tok,
    ...overrides,
  });
  return { data, error, token: tok };
}
before(async () => {
  await sql.connect();
  const a = await user("org-a", "organizador"),
    b = await user("org-b", "organizador"),
    g = await user("guest"),
    g2 = await user("guest-2");
  orgA = a.id;
  orgB = b.id;
  guest = g.id;
  guest2 = g2.id;
  assert.ifError(
    (
      await admin.from("organizadores").insert([
        {
          id: a.id,
          nome: "Ana Organizadora",
          email: a.email,
          cpf: "11144477735",
          telefone: "11987654321",
        },
        {
          id: b.id,
          nome: "Bruno Organizador",
          email: b.email,
          cpf: "12345678909",
          telefone: "11987654321",
        },
      ])
    ).error,
  );
  clientA = await login(a.email);
  clientB = await login(b.email);
  clientGuest = await login(g.email);
  passwordGuest = await login(g.email);
  passwordSession = await session(passwordGuest);
  otherSession = await session(await login(g2.email));
  guestSession = await session(clientGuest);
  const ev = await clientA
    .from("eventos")
    .insert({
      nome: "Evento de integração",
      data: "2027-12-01",
      horario: "10:00",
      local: "Auditório de teste",
      organizador_id: orgA,
    })
    .select("*")
    .single();
  assert.ifError(ev.error);
  event = ev.data!.id;
  const inv = await emit(g.email);
  assert.ifError(inv.error);
  invite = inv.data.id;
  token = inv.token;
});
after(async () => {
  for (const id of users) await admin.auth.admin.deleteUser(id);
  await sql.query("delete from private.limites where chave like $1", [
    `test:${tag}%`,
  ]);
  await sql.end();
});
describe("Sprint 1: Supabase/Auth/Postgres reais", () => {
  it("owner lista seu evento e outro organizador não vê", async () => {
    assert.equal(
      (await clientA.from("eventos").select("id").eq("id", event)).data?.length,
      1,
    );
    assert.equal(
      (await clientB.from("eventos").select("id").eq("id", event)).data?.length,
      0,
    );
  });
  it("não aceita organizer_id de outro usuário", async () => {
    assert.ok(
      (
        await clientB
          .from("eventos")
          .insert({
            nome: "Evento indevido",
            data: "2027-12-01",
            horario: "10:00",
            local: "Auditório",
            organizador_id: orgA,
          })
      ).error,
    );
  });
  it("metadados adulterados não criam afiliação nem acesso", async () => {
    assert.ifError(
      (await clientGuest.auth.updateUser({ data: { perfil: "organizador" } }))
        .error,
    );
    assert.ok(
      (
        await clientGuest
          .from("organizadores")
          .insert({
            id: guest,
            nome: "Maria da Silva",
            email: `guest-${tag}@example.test`,
            cpf: "52998224725",
            telefone: "11987654321",
          })
      ).error,
    );
    assert.equal(
      (await clientGuest.from("eventos").select("id").eq("id", event)).data
        ?.length,
      0,
    );
  });
  it("convite e outbox são atômicos e secretos ao browser", async () => {
    const { data } = await admin
      .from("notificacoes")
      .select("id,payload")
      .eq("convite_id", invite);
    assert.equal(data?.length, 1);
    assert.equal(data?.[0].payload.token, token);
    assert.ok((await clientA.from("notificacoes").select("*")).error);
    assert.ok((await clientA.from("convites").select("token_hash")).error);
  });
  it("browser/anônimo não executam funções privilegiadas nem editam resposta", async () => {
    const args = {
      p_usuario: guest,
      p_sessao: guestSession,
      p_convite: invite,
      p_status: "confirmado",
    };
    assert.ok((await anon().rpc("responder_convite", args)).error);
    assert.ok((await clientGuest.rpc("responder_convite", args)).error);
    assert.ok(
      (
        await clientA
          .from("convites")
          .update({ status: "confirmado" })
          .eq("id", invite)
      ).error,
    );
    assert.ok(
      (
        await clientGuest.rpc("registrar_prova_postal", {
          p_usuario: guest,
          p_sessao: guestSession,
          p_convite: invite,
        })
      ).error,
    );
  });
  it("duplicidade não cria outra notificação e evento alheio rejeita emissão", async () => {
    const d = await emit(`guest-${tag}@example.test`);
    assert.equal(d.error?.code, "23505");
    assert.equal(
      (await admin.from("notificacoes").select("id").eq("convite_id", invite))
        .data?.length,
      1,
    );
    assert.match(
      (await emit(`outro-${tag}@example.test`, { p_organizador: orgB })).error
        ?.message ?? "",
      /EVENTO_NAO_ENCONTRADO/,
    );
  });
  it("e-mail auto-confirmado e senha sem prova postal não capturam convite", async () => {
    const args = {
      p_usuario: guest,
      p_sessao: guestSession,
      p_token_hash: hash(token),
      p_nome: "Maria da Silva",
      p_cpf: "52998224725",
      p_telefone: "11987654321",
    };
    assert.match(
      (await admin.rpc("cadastrar_convidado", args)).error?.message ?? "",
      /IDENTIDADE_NAO_VERIFICADA/,
    );
    assert.equal(
      (await admin.from("convidados").select("id").eq("id", guest)).data
        ?.length,
      0,
    );
    assert.match(
      (
        await admin.rpc("registrar_prova_postal", {
          p_usuario: guest2,
          p_sessao: otherSession,
          p_convite: invite,
        })
      ).error?.message ?? "",
      /IDENTIDADE_NAO_VERIFICADA/,
    );
  });
  it("OTP real autoriza cadastro idempotente exclusivamente na sessão que o consumiu", async () => {
    guestSession = await proof(
      clientGuest,
      `guest-${tag}@example.test`,
      guest,
      invite,
    );
    const args = {
      p_usuario: guest,
      p_sessao: guestSession,
      p_token_hash: hash(token),
      p_nome: "Maria da Silva",
      p_cpf: "52998224725",
      p_telefone: "11987654321",
    };
    assert.ifError((await admin.rpc("cadastrar_convidado", args)).error);
    assert.ifError((await admin.rpc("cadastrar_convidado", args)).error);
    assert.equal(
      (await clientGuest.from("convidados").select("id")).data?.length,
      1,
    );
    assert.equal(
      (await clientGuest.from("eventos").select("id").eq("id", event)).data
        ?.length,
      1,
    );
    assert.equal(
      (await clientGuest.from("convites").select("id")).data?.length,
      1,
    );
  });
  it("sessões por senha anterior e posterior não herdam prova ou dados da vítima", async () => {
    const fresh = await login(`guest-${tag}@example.test`);
    for (const c of [passwordGuest, fresh]) {
      assert.equal((await c.from("convidados").select("id")).data?.length, 0);
      assert.equal((await c.from("convites").select("id")).data?.length, 0);
      assert.equal(
        (await c.from("eventos").select("id").eq("id", event)).data?.length,
        0,
      );
      assert.match(
        (
          await admin.rpc("responder_convite", {
            p_usuario: guest,
            p_sessao: await session(c),
            p_convite: invite,
            p_status: "confirmado",
          })
        ).error?.message ?? "",
        /IDENTIDADE_NAO_VERIFICADA/,
      );
    }
    assert.notEqual(passwordSession, guestSession);
  });
  it("confirmação concorrente produz uma resposta e uma notificação", async () => {
    const args = {
      p_usuario: guest,
      p_sessao: guestSession,
      p_convite: invite,
      p_status: "confirmado",
    };
    (
      await Promise.all(
        Array.from({ length: 4 }, () => admin.rpc("responder_convite", args)),
      )
    ).forEach((r) => assert.ifError(r.error));
    assert.equal(
      (await admin.from("convites").select("status").eq("id", invite).single())
        .data?.status,
      "confirmado",
    );
    assert.equal(
      (
        await admin
          .from("notificacoes")
          .select("id")
          .eq("convite_id", invite)
          .eq("tipo", "confirmacao")
      ).data?.length,
      1,
    );
    assert.match(
      (await admin.rpc("responder_convite", { ...args, p_status: "recusado" }))
        .error?.message ?? "",
      /RESPOSTA_JA_REGISTRADA/,
    );
  });
  it("confirmação esgotada pode ser recuperada pelo titular com prova", async () => {
    await admin
      .from("notificacoes")
      .update({ estado: "falhou", tentativas: 10 })
      .eq("convite_id", invite)
      .eq("tipo", "confirmacao");
    assert.ifError(
      (
        await admin.rpc("recuperar_notificacao", {
          p_usuario: guest,
          p_sessao: guestSession,
          p_convite: invite,
          p_tipo: "confirmacao",
        })
      ).error,
    );
    const { data } = await admin
      .from("notificacoes")
      .select("estado,tentativas,chave")
      .eq("convite_id", invite)
      .eq("tipo", "confirmacao")
      .single();
    assert.equal(data!.estado, "pendente");
    assert.equal(data!.tentativas, 0);
    assert.equal(data!.chave, `confirmacao:${invite}`);
    assert.ok(
      (
        await admin.rpc("recuperar_notificacao", {
          p_usuario: guest2,
          p_sessao: otherSession,
          p_convite: invite,
          p_tipo: "confirmacao",
        })
      ).error,
    );
  });
  it("convite expirado não cadastra nem responde; recusa não gera confirmação", async () => {
    const g2 = await user("expired");
    const r = await emit(g2.email);
    assert.ifError(r.error);
    const c = anon(),
      sid = await proof(c, g2.email, g2.id, r.data.id);
    const args = {
      p_usuario: g2.id,
      p_sessao: sid,
      p_token_hash: hash(r.token),
      p_nome: "Outra Pessoa",
      p_cpf: "39053344705",
      p_telefone: "11987654321",
    };
    assert.ifError((await admin.rpc("cadastrar_convidado", args)).error);
    await admin
      .from("convites")
      .update({ expira_em: "2020-01-01T00:00:00Z" })
      .eq("id", r.data.id);
    assert.match(
      (
        await admin.rpc("responder_convite", {
          p_usuario: g2.id,
          p_sessao: sid,
          p_convite: r.data.id,
          p_status: "recusado",
        })
      ).error?.message ?? "",
      /CONVITE_EXPIRADO/,
    );
    assert.match(
      (await admin.rpc("cadastrar_convidado", args)).error?.message ?? "",
      /CONVITE_INVALIDO/,
    );
    const g3 = await user("recusa");
    const r2 = await emit(g3.email);
    assert.ifError(r2.error);
    const c2 = anon(),
      sid2 = await proof(c2, g3.email, g3.id, r2.data.id);
    assert.ifError(
      (
        await admin.rpc("cadastrar_convidado", {
          p_usuario: g3.id,
          p_sessao: sid2,
          p_token_hash: hash(r2.token),
          p_nome: "Outra Pessoa",
          p_cpf: "12345678909",
          p_telefone: "11987654321",
        })
      ).error,
    );
    assert.ifError(
      (
        await admin.rpc("responder_convite", {
          p_usuario: g3.id,
          p_sessao: sid2,
          p_convite: r2.data.id,
          p_status: "recusado",
        })
      ).error,
    );
    assert.equal(
      (
        await admin
          .from("notificacoes")
          .select("id")
          .eq("convite_id", r2.data.id)
          .eq("tipo", "confirmacao")
      ).data?.length,
      0,
    );
  });
  it("rate limit persistente é seguro em concorrência", async () => {
    const args = { p_chave: `test:${tag}`, p_limite: 2, p_segundos: 300 };
    const r = await Promise.all(
      Array.from({ length: 5 }, () => admin.rpc("consumir_limite", args)),
    );
    r.forEach((x) => assert.ifError(x.error));
    assert.equal(r.filter((x) => x.data === true).length, 2);
  });
  it("claims concorrentes não processam duas vezes a mesma mensagem", async () => {
    const r = await Promise.all([
      admin.rpc("claim_notificacoes", { p_limite: 10, p_convite: invite }),
      admin.rpc("claim_notificacoes", { p_limite: 10, p_convite: invite }),
    ]);
    r.forEach((x) => assert.ifError(x.error));
    const ids = r.flatMap((x) => x.data.map((n: { id: number }) => n.id));
    assert.equal(ids.length, new Set(ids).size);
    assert.equal(ids.length, 2);
  });
  it("Auth OTP cria identidade verificada sem promover organizador", async () => {
    const email = `novo-${tag}@example.test`;
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    assert.ifError(link.error);
    users.push(link.data.user!.id);
    const c = anon();
    const verify = await c.auth.verifyOtp({
      type: "email",
      token_hash: link.data.properties!.hashed_token,
    });
    assert.ifError(verify.error);
    assert.ok(verify.data.user?.email_confirmed_at);
    assert.equal((await c.from("organizadores").select("id")).data?.length, 0);
  });
});
