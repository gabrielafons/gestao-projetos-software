import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { avaliarSenha, senhaEhForte } from "@/lib/validators/senha";

describe("senhaEhForte", () => {
  it("aceita senha com os cinco requisitos", () => {
    assert.equal(senhaEhForte("Evently@2026"), true);
  });

  it("rejeita senha curta, mesmo variada", () => {
    assert.equal(senhaEhForte("Ev@1"), false);
  });

  it("rejeita senha sem maiuscula, sem numero ou sem simbolo", () => {
    assert.equal(senhaEhForte("evently@2026"), false);
    assert.equal(senhaEhForte("Evently@abc"), false);
    assert.equal(senhaEhForte("Evently2026"), false);
  });

  it("rejeita senha acima do limite do bcrypt", () => {
    assert.equal(senhaEhForte(`A1@${"a".repeat(70)}`), false);
  });
});

describe("avaliarSenha", () => {
  it("marca nenhum requisito para senha vazia", () => {
    const atendidos = avaliarSenha("").filter((r) => r.atendido);
    assert.equal(atendidos.length, 0);
  });

  it("marca apenas o tamanho para uma senha longa so de minusculas", () => {
    const resultado = avaliarSenha("abcdefghij");
    const atendidos = resultado.filter((r) => r.atendido).map((r) => r.id);
    assert.deepEqual(atendidos.sort(), ["minuscula", "tamanho"]);
  });

  it("marca os cinco requisitos para uma senha forte", () => {
    const atendidos = avaliarSenha("Evently@2026").filter((r) => r.atendido);
    assert.equal(atendidos.length, 5);
  });
});
