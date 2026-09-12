import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extrairErrosPorCampo,
  schemaCadastroOrganizador,
} from "@/lib/validators/organizador";

const VALIDO = {
  nome: "  Giovane Contreras Oba  ",
  email: "  GIOVANE@EXEMPLO.COM ",
  cpf: "529.982.247-25",
  telefone: "(11) 98765-4321",
  senha: "Evently@2026",
};

describe("schemaCadastroOrganizador - cenario 1 (dados corretos)", () => {
  it("aceita e normaliza os dados para o formato do banco", () => {
    const resultado = schemaCadastroOrganizador.safeParse(VALIDO);

    assert.equal(resultado.success, true);
    assert.deepEqual(resultado.data, {
      nome: "Giovane Contreras Oba",
      email: "giovane@exemplo.com",
      cpf: "52998224725",
      telefone: "11987654321",
      senha: "Evently@2026",
    });
  });
});

describe("schemaCadastroOrganizador - cenario 2 (dados invalidos)", () => {
  it("aponta todos os campos obrigatorios quando nada e preenchido", () => {
    const resultado = schemaCadastroOrganizador.safeParse({
      nome: "",
      email: "",
      cpf: "",
      telefone: "",
      senha: "",
    });

    assert.equal(resultado.success, false);
    const erros = extrairErrosPorCampo(resultado.error!);
    assert.deepEqual(Object.keys(erros).sort(), [
      "cpf",
      "email",
      "nome",
      "senha",
      "telefone",
    ]);
  });

  it("rejeita CPF com digito verificador invalido", () => {
    const resultado = schemaCadastroOrganizador.safeParse({
      ...VALIDO,
      cpf: "111.111.111-11",
    });

    assert.equal(resultado.success, false);
    assert.match(extrairErrosPorCampo(resultado.error!).cpf!, /CPF invalido/);
  });

  it("rejeita senha fraca e diz qual requisito falta", () => {
    const resultado = schemaCadastroOrganizador.safeParse({
      ...VALIDO,
      senha: "apenasletras",
    });

    assert.equal(resultado.success, false);
    assert.match(
      extrairErrosPorCampo(resultado.error!).senha!,
      /A senha precisa de:/,
    );
  });

  it("rejeita nome sem sobrenome", () => {
    const resultado = schemaCadastroOrganizador.safeParse({
      ...VALIDO,
      nome: "Giovane",
    });

    assert.equal(resultado.success, false);
    assert.match(
      extrairErrosPorCampo(resultado.error!).nome!,
      /nome e sobrenome/i,
    );
  });

  it("rejeita nome acima de 50 caracteres", () => {
    const resultado = schemaCadastroOrganizador.safeParse({
      ...VALIDO,
      nome: `${"Giovane".repeat(7)} Oba`,
    });

    assert.equal(resultado.success, false);
    assert.match(extrairErrosPorCampo(resultado.error!).nome!, /50 caracteres/);
  });

  it("rejeita e-mail acima de 254 caracteres", () => {
    const resultado = schemaCadastroOrganizador.safeParse({
      ...VALIDO,
      email: `${"a".repeat(250)}@exemplo.com`,
    });

    assert.equal(resultado.success, false);
    assert.match(extrairErrosPorCampo(resultado.error!).email!, /254/);
  });

  it("guarda apenas a primeira mensagem de cada campo", () => {
    const resultado = schemaCadastroOrganizador.safeParse({
      ...VALIDO,
      nome: "a",
    });

    assert.equal(resultado.success, false);
    const erros = extrairErrosPorCampo(resultado.error!);
    assert.equal(typeof erros.nome, "string");
  });
});
