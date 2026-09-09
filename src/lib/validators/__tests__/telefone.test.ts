import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatarTelefone,
  normalizarTelefone,
  telefoneEhValido,
} from "@/lib/validators/telefone";

describe("normalizarTelefone", () => {
  it("remove parenteses, espacos e tracos", () => {
    assert.equal(normalizarTelefone("(11) 98765-4321"), "11987654321");
  });
});

describe("telefoneEhValido", () => {
  it("aceita celular com 11 digitos e fixo com 10", () => {
    assert.equal(telefoneEhValido("(11) 98765-4321"), true);
    assert.equal(telefoneEhValido("1133334444"), true);
  });

  it("rejeita numero curto demais ou longo demais", () => {
    assert.equal(telefoneEhValido("987654321"), false);
    assert.equal(telefoneEhValido("119876543210"), false);
  });

  it("rejeita DDD comecando em zero", () => {
    assert.equal(telefoneEhValido("01987654321"), false);
  });
});

describe("formatarTelefone", () => {
  it("formata celular e fixo com mascaras diferentes", () => {
    assert.equal(formatarTelefone("11987654321"), "(11) 98765-4321");
    assert.equal(formatarTelefone("1133334444"), "(11) 3333-4444");
  });

  it("formata parcialmente durante a digitacao", () => {
    assert.equal(formatarTelefone("11"), "11");
    assert.equal(formatarTelefone("119876"), "(11) 9876");
  });
});
