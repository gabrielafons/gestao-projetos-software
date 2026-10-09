import { test } from "node:test";
import assert from "node:assert/strict";
import { cadastrarOrganizador } from "../organizadores";
import type { criarClienteAdmin } from "@/lib/supabase/admin";
const dados = {
  nome: "Ana Organizadora",
  email: "ana@example.test",
  cpf: "52998224725",
  telefone: "11987654321",
  senha: "Evently@Test2026",
};
function cliente(erroAuth: boolean, erroCompensacao: boolean) {
  let removidos = 0;
  const db = {
    auth: {
      admin: {
        createUser: async () => ({
          data: { user: erroAuth ? null : { id: "criado-nesta-tentativa" } },
          error: erroAuth ? { code: "unavailable" } : null,
        }),
        deleteUser: async (id: string) => {
          assert.equal(id, "criado-nesta-tentativa");
          removidos++;
          return { error: erroCompensacao ? { code: "unavailable" } : null };
        },
      },
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { code: "XX000" } }),
        }),
      }),
    }),
  };
  return {
    db: db as unknown as ReturnType<typeof criarClienteAdmin>,
    removidos: () => removidos,
  };
}
test("falha Auth não remove identidade que não criou", async () => {
  const c = cliente(true, false);
  const r = await cadastrarOrganizador(dados, c.db);
  assert.equal(r.sucesso, false);
  assert.equal(c.removidos(), 0);
});
test("falha de perfil compensa exclusivamente a identidade criada na tentativa", async () => {
  const c = cliente(false, false);
  const r = await cadastrarOrganizador(dados, c.db);
  assert.equal(r.sucesso, false);
  assert.equal(c.removidos(), 1);
});
test("falha da compensação requer suporte sem fingir que a conta foi removida", async () => {
  const c = cliente(false, true);
  const r = await cadastrarOrganizador(dados, c.db);
  assert.equal(r.sucesso, false);
  assert.equal(c.removidos(), 1);
  if (!r.sucesso) assert.match(r.mensagem, /suporte antes de tentar novamente/);
});
