import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extrairErrosLogin, schemaLogin } from "@/lib/validators/login";

describe("schemaLogin", () => {
  it("aceita e normaliza e-mail com espacos e maiusculas", () => {
    const resultado = schemaLogin.safeParse({
      email: "  GIOVANE@EXEMPLO.COM ",
      senha: "Evently@2026",
    });

    assert.equal(resultado.success, true);
    assert.equal(resultado.data?.email, "giovane@exemplo.com");
  });

  it("exige e-mail e senha", () => {
    const resultado = schemaLogin.safeParse({ email: "", senha: "" });

    assert.equal(resultado.success, false);
    assert.deepEqual(Object.keys(extrairErrosLogin(resultado.error!)).sort(), [
      "email",
      "senha",
    ]);
  });

  it("nao aplica as regras de senha forte no login", () => {
    // Quem se cadastrou antes de a regra endurecer precisa continuar entrando.
    const resultado = schemaLogin.safeParse({
      email: "giovane@exemplo.com",
      senha: "123",
    });

    assert.equal(resultado.success, true);
  });

  it("rejeita e-mail mal formado", () => {
    const resultado = schemaLogin.safeParse({
      email: "giovane",
      senha: "Evently@2026",
    });

    assert.equal(resultado.success, false);
    assert.match(extrairErrosLogin(resultado.error!).email!, /e-mail valido/);
  });
});
