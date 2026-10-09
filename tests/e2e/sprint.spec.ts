import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (
  !["http://localhost:55431", "http://127.0.0.1:55431"].includes(url) ||
  process.env.EMAIL_TRANSPORT !== "local"
)
  throw new Error(
    "E2E exige ambiente Evently local dedicado e e-mails capturados.",
  );
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const senha = "Evently@Test2026";
const ids: string[] = [];
const emails: string[] = [];
const email = (name: string) =>
  `${name}-${randomBytes(6).toString("hex")}@example.test`;
function cpf() {
  const n = Array.from(randomBytes(9), (x) => x % 10);
  for (let size = 9; size <= 10; size++) {
    const sum = n.reduce((s, v, i) => s + v * (size + 1 - i), 0);
    const d = (sum * 10) % 11;
    n.push(d === 10 ? 0 : d);
  }
  return n.join("");
}
async function signup(
  request: APIRequestContext,
  address = email("org"),
  document = cpf(),
) {
  emails.push(address);
  const r = await request.post("/api/organizadores", {
    data: {
      nome: "Ana Organizadora",
      email: address,
      cpf: document,
      telefone: "11987654321",
      senha,
    },
  });
  expect(r.status()).toBe(201);
  const body = await r.json();
  ids.push(body.organizador.id);
  return { id: body.organizador.id, email: address, cpf: document };
}
async function login(page: Page, address: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(address);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
async function event(request: APIRequestContext) {
  const r = await request.post("/api/eventos", {
    data: {
      nome: "Encontro Evently",
      data: "2027-12-01",
      horario: "10:00",
      local: "Auditório Central",
    },
  });
  expect(r.status()).toBe(201);
  return (await r.json()).evento.id as number;
}
async function emit(
  request: APIRequestContext,
  eventId: number,
  address: string,
) {
  emails.push(address);
  const r = await request.post("/api/convites", {
    data: {
      evento_id: eventId,
      nome_convidado: "Maria da Silva",
      email: address,
      cpf: "52998224725",
      telefone: "11987654321",
    },
  });
  expect(r.status()).toBe(201);
  return r.json();
}
async function message(address: string, subject: string) {
  let found: { ID: string } | undefined;
  await expect
    .poll(async () => {
      const data = await fetch("http://127.0.0.1:55434/api/v1/messages").then(
        (r) => r.json(),
      );
      found = data.messages.find(
        (m: { To: { Address: string }[]; Subject: string }) =>
          m.To.some((t) => t.Address === address) &&
          m.Subject.includes(subject),
      );
      return Boolean(found);
    })
    .toBe(true);
  return fetch(`http://127.0.0.1:55434/api/v1/message/${found!.ID}`).then((r) =>
    r.json(),
  );
}
async function inviteLink(address: string) {
  const m = await message(address, "Você recebeu");
  return m.HTML.match(
    /http:\/\/localhost:3100\/convite\/[a-f0-9]{64}/,
  )[0] as string;
}
async function join(page: Page, address: string) {
  const link = await inviteLink(address);
  await page.goto(link);
  await page
    .getByRole("button", { name: "Receber link de acesso por e-mail" })
    .click();
  await expect(
    page.getByRole("button", { name: "Solicitação recebida" }),
  ).toBeVisible();
  const m = await message(address, "Confirme seu acesso");
  const access = m.HTML.match(
    /http:\/\/localhost:3100\/auth\/confirm\?[^"<> ]+/,
  )[0].replaceAll("&amp;", "&");
  await page.goto(access);
  await page
    .getByRole("button", { name: "Verificar meu e-mail e continuar" })
    .click();
  await expect(page).toHaveURL(/\/cadastro\/convidado/);
  await expect(page.getByLabel("E-mail")).toHaveValue(address);
  await page
    .getByRole("button", { name: "Concluir cadastro e ver convites" })
    .click();
  await expect(page).toHaveURL(/\/meus-convites$/);
}
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({
    "x-forwarded-for":
      "fd42:" +
      randomBytes(6).toString("hex").match(/.{4}/g)!.join(":") +
      "::1",
  });
});
test.afterEach(async () => {
  for (const address of emails.splice(0)) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const u = data.users.find((u) => u.email === address);
    if (u && !ids.includes(u.id)) ids.push(u.id);
  }
  for (const id of ids.splice(0)) {
    const { error } = await admin.auth.admin.deleteUser(id);
    expect(error).toBeNull();
  }
});
test("jornada visual completa: cadastro, evento, convite entregue, convidado e confirmação", async ({
  page,
  browser,
}) => {
  const address = email("org-ui");
  emails.push(address);
  await page.goto("/cadastro/organizador");
  await page.getByLabel("Nome completo").fill("Ana Organizadora");
  await page.getByLabel("E-mail").fill(address);
  await page.getByLabel("CPF").fill(cpf());
  await page.getByLabel("Telefone").fill("11987654321");
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
  await page.getByRole("link", { name: "Criar evento", exact: true }).click();
  await page.getByLabel("Nome do evento").fill("Encontro Evently");
  await page.getByLabel("Data").fill("2027-12-01");
  await page.getByLabel("Horário").fill("10:00");
  await page.getByLabel("Local do evento").fill("Auditório Central");
  await page.getByRole("button", { name: "Criar evento", exact: true }).click();
  await expect(page).toHaveURL(/\/painel\/eventos\/\d+$/);
  const detail = page.url();
  const guest = email("guest-ui");
  emails.push(guest);
  await page.getByLabel("Nome completo").fill("Maria da Silva");
  await page.getByLabel("E-mail").fill(guest);
  await page.getByLabel("CPF").fill("52998224725");
  await page.getByLabel("Telefone").fill("11987654321");
  await page.getByRole("button", { name: "Emitir e enviar convite" }).click();
  await expect(
    page.getByText("Convite criado e e-mail enviado."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Maria da Silva" }),
  ).toBeVisible();
  const convite = await message(guest, "Você recebeu");
  expect(convite.HTML).toContain("Auditório Central");
  expect(convite.HTML).not.toContain("52998224725");
  const link = await inviteLink(guest);
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const participant = await ctx.newPage();
  await participant.goto(link);
  await expect(participant.getByText(guest, { exact: true })).toHaveCount(0);
  expect(await participant.locator("body").innerText()).not.toContain(
    "52998224725",
  );
  const { data: before } = await admin.auth.admin.listUsers();
  expect(before.users.some((u) => u.email === guest)).toBe(false); // scanner GET did not provision identity
  await join(participant, guest);
  await participant.getByRole("link", { name: /Ver convite/ }).click();
  await participant
    .getByRole("button", { name: "Confirmar presença", exact: true })
    .click();
  await expect(
    participant.getByText("Presença confirmada", { exact: true }),
  ).toBeVisible();
  await participant.reload();
  await expect(
    participant.getByRole("button", {
      name: "Confirmar presença",
      exact: true,
    }),
  ).toHaveCount(0);
  await message(guest, "Sua presença está confirmada");
  await page.goto(detail);
  await expect(
    page.getByText("Presença confirmada", { exact: true }),
  ).toBeVisible();
  expect(
    await participant.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await participant.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(participant).toHaveURL(/\/login/);
  await participant.goto("/meus-convites");
  await expect(participant).toHaveURL(/\/login/);
  await ctx.close();
});
test("HTTP: validação, duplicidade, compensação de CPF e proteção de origem", async ({
  page,
}) => {
  const org = await signup(page.request);
  const duplicate = await page.request.post("/api/organizadores", {
    data: {
      nome: "Outra Pessoa",
      email: org.email,
      cpf: cpf(),
      telefone: "11987654321",
      senha,
    },
  });
  expect(duplicate.status()).toBe(409);
  const address = email("cpf-dup");
  emails.push(address);
  const dupCPF = await page.request.post("/api/organizadores", {
    data: {
      nome: "Outra Pessoa",
      email: address,
      cpf: org.cpf,
      telefone: "11987654321",
      senha,
    },
  });
  expect(dupCPF.status()).toBe(409);
  const { data } = await admin.auth.admin.listUsers();
  expect(data.users.some((u) => u.email === address)).toBe(false);
  const malformed = await page.request.post("/api/eventos", {
    data: "{",
    headers: { "Content-Type": "application/json" },
  });
  expect(malformed.status()).toBe(400);
  const csrf = await page.request.post("/api/eventos", {
    data: {},
    headers: { origin: "https://evil.example" },
  });
  expect(csrf.status()).toBe(403);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(org.email);
  await page.getByLabel("Senha").fill("SenhaErrada123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await login(page, org.email);
  const ev = await event(page.request);
  const bad = await page.request.post("/api/eventos", {
    data: {
      nome: "Encontro",
      data: "2027-02-30",
      horario: "10:00",
      local: "Auditório",
    },
  });
  expect(bad.status()).toBe(400);
  const guest = email("duplicate");
  await emit(page.request, ev, guest);
  expect(
    (
      await page.request.post("/api/convites", {
        data: {
          evento_id: ev,
          nome_convidado: "Maria da Silva",
          email: guest,
          cpf: "52998224725",
          telefone: "11987654321",
        },
      })
    ).status(),
  ).toBe(409);
});
test("falha do e-mail preserva convite e reenvio recupera sem duplicar", async ({
  page,
}) => {
  const org = await signup(page.request);
  await login(page, org.email);
  const ev = await event(page.request);
  const address = email("recovery");
  let body;
  execFileSync("docker", ["stop", "supabase_inbucket_evently-sprint1"], {
    stdio: "pipe",
  });
  try {
    body = await emit(page.request, ev, address);
    expect(body.envio_status).toBe("falhou");
  } finally {
    execFileSync("docker", ["start", "supabase_inbucket_evently-sprint1"], {
      stdio: "pipe",
    });
  }
  await page.goto(`/painel/eventos/${ev}`);
  await expect(
    page.getByText("Falha no envio do e-mail", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tentar envio novamente" }).click();
  await expect(page.getByText("E-mail enviado", { exact: true })).toBeVisible();
  await message(address, "Você recebeu");
  const retry = await page.request.post(
    `/api/convites/${body.convite.id}/reenviar`,
    { data: {} },
  );
  expect(retry.ok()).toBe(true);
  const { data } = await admin
    .from("notificacoes")
    .select("id,estado")
    .eq("convite_id", body.convite.id);
  expect(data).toHaveLength(1);
  expect(data![0].estado).toBe("enviado");
});
test("organizador existente também pode ser convidado e recusar sem perder privilégios", async ({
  page,
}) => {
  const org = await signup(page.request);
  await login(page, org.email);
  const ev = await event(page.request);
  const body = await emit(page.request, ev, org.email);
  await join(page, org.email);
  await page.getByRole("link", { name: /Ver convite/ }).click();
  await page.getByRole("button", { name: "Recusar convite" }).click();
  await expect(
    page.getByText("Convite recusado", { exact: true }),
  ).toBeVisible();
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/painel$/);
  await expect(
    page.getByRole("heading", { name: "Meus eventos" }),
  ).toBeVisible();
  const { data } = await admin
    .from("notificacoes")
    .select("id")
    .eq("convite_id", body.convite.id)
    .eq("tipo", "confirmacao");
  expect(data).toHaveLength(0);
  expect(
    (await admin.auth.admin.getUserById(org.id)).data.user!.app_metadata.perfil,
  ).toBe("organizador");
});
test("inválido, expirado e organizador alheio não acessam convite/evento", async ({
  page,
  browser,
}) => {
  const org = await signup(page.request);
  await login(page, org.email);
  const ev = await event(page.request);
  const address = email("expired");
  const body = await emit(page.request, ev, address);
  const link = await inviteLink(address);
  await admin
    .from("convites")
    .update({ expira_em: "2020-01-01T00:00:00Z" })
    .eq("id", body.convite.id);
  await page.goto(link);
  await expect(
    page.getByRole("button", { name: "Receber link de acesso por e-mail" }),
  ).toHaveCount(0);
  await page.goto(`/convite/${"0".repeat(64)}`);
  await expect(
    page.getByRole("button", { name: "Receber link de acesso por e-mail" }),
  ).toHaveCount(0);
  const ctx = await browser.newContext();
  const b = await ctx.newPage();
  const other = await signup(b.request);
  await login(b, other.email);
  await b.goto(`/painel/eventos/${ev}`);
  await expect(
    b.getByRole("heading", { name: /Página indisponível/ }),
  ).toBeVisible();
  const r = await b.request.post("/api/convites", {
    data: {
      evento_id: ev,
      nome_convidado: "Outra Pessoa",
      email: email("wrong"),
      cpf: "52998224725",
      telefone: "11987654321",
    },
  });
  expect(r.status()).toBe(404);
  await ctx.close();
});
test("cadastro já criado sobrevive à falha de rede no login automático", async ({
  page,
}) => {
  const address = email("signup-network");
  emails.push(address);
  await page.route("**/api/sessao", (route) => route.abort("connectionfailed"));
  await page.goto("/cadastro/organizador");
  await page.getByLabel("Nome completo").fill("Ana Organizadora");
  await page.getByLabel("E-mail").fill(address);
  await page.getByLabel("CPF").fill(cpf());
  await page.getByLabel("Telefone").fill("11987654321");
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Cadastro realizado" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar conta" })).toHaveCount(
    0,
  );
  const { data } = await admin
    .from("organizadores")
    .select("id")
    .eq("email", address);
  expect(data).toHaveLength(1);
});
test("confirmação falha conserva presença e recupera notificação esgotada pela UI", async ({
  page,
  browser,
}) => {
  const org = await signup(page.request);
  await login(page, org.email);
  const ev = await event(page.request);
  const address = email("confirmation-failure");
  const body = await emit(page.request, ev, address);
  const ctx = await browser.newContext();
  const guest = await ctx.newPage();
  await join(guest, address);
  await guest.getByRole("link", { name: /Ver convite/ }).click();
  execFileSync("docker", ["stop", "supabase_inbucket_evently-sprint1"], {
    stdio: "pipe",
  });
  try {
    await guest
      .getByRole("button", { name: "Confirmar presença", exact: true })
      .click();
    await expect(
      guest.getByText("Presença confirmada", { exact: true }),
    ).toBeVisible();
    await expect(
      guest.getByText(
        "Falha no envio do e-mail de confirmação. Sua presença continua confirmada.",
        { exact: true },
      ),
    ).toBeVisible();
  } finally {
    execFileSync("docker", ["start", "supabase_inbucket_evently-sprint1"], {
      stdio: "pipe",
    });
  }
  await admin
    .from("notificacoes")
    .update({ tentativas: 10 })
    .eq("convite_id", body.convite.id)
    .eq("tipo", "confirmacao");
  await guest.reload();
  await guest.getByRole("button", { name: "Tentar envio novamente" }).click();
  await expect(
    guest.getByText("E-mail de confirmação enviado.", { exact: true }),
  ).toBeVisible();
  await message(address, "Sua presença está confirmada");
  const { data } = await admin
    .from("notificacoes")
    .select("id,estado")
    .eq("convite_id", body.convite.id)
    .eq("tipo", "confirmacao");
  expect(data).toHaveLength(1);
  expect(data![0].estado).toBe("enviado");
  await ctx.close();
});
test("dois convites mantêm histórico na mesma sessão sem dar prova a senha pré-cadastrada", async ({
  page,
  browser,
}) => {
  const org = await signup(page.request);
  await login(page, org.email);
  const evA = await event(page.request),
    evB = await event(page.request);
  const address = email("preclaimed");
  const a = await emit(page.request, evA, address);
  const linkA = await inviteLink(address);
  const attackerContext = await browser.newContext();
  const attacker = await attackerContext.newPage();
  await signup(attacker.request, address);
  await login(attacker, address);
  const tokenA = new URL(linkA).pathname.split("/").pop()!;
  const capture = () =>
    attacker.request.post("/api/convidados", {
      data: {
        nome: "Maria da Silva",
        email: address,
        cpf: "52998224725",
        telefone: "11987654321",
        token: tokenA,
      },
    });
  expect((await capture()).status()).toBe(403);
  await attacker.goto(`/cadastro/convidado?convite=${tokenA}`);
  await expect(
    attacker.getByRole("button", { name: "Concluir cadastro e ver convites" }),
  ).toHaveCount(0);
  const victimContext = await browser.newContext();
  const victim = await victimContext.newPage();
  await join(victim, address);
  await victim.getByRole("link", { name: /Ver convite/ }).click();
  await victim
    .getByRole("button", { name: "Confirmar presença", exact: true })
    .click();
  await expect(
    victim.getByText("Presença confirmada", { exact: true }),
  ).toBeVisible();
  await admin
    .from("convites")
    .update({ expira_em: "2020-01-01T00:00:00Z" })
    .eq("id", a.convite.id);
  const b = await emit(page.request, evB, address);
  expect(b.convite.id).not.toBe(a.convite.id);
  await join(victim, address);
  await expect(victim.getByRole("link", { name: /Ver convite/ })).toHaveCount(
    2,
  );
  await expect(
    victim.getByText("Presença confirmada", { exact: true }),
  ).toBeVisible();
  expect((await capture()).status()).toBe(403);
  expect(
    (
      await attacker.request.patch(`/api/convites/${a.convite.id}`, {
        data: { status: "confirmado" },
      })
    ).status(),
  ).toBe(403);
  await attacker.goto("/meus-convites");
  await expect(attacker.getByRole("link", { name: /Ver convite/ })).toHaveCount(
    0,
  );
  await login(attacker, address);
  await attacker.goto("/meus-convites");
  await expect(attacker.getByRole("link", { name: /Ver convite/ })).toHaveCount(
    0,
  );
  await attackerContext.close();
  await victimContext.close();
});
