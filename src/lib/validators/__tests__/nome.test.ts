import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizarNome, nomeCompletoEhValido } from "@/lib/validators/nome";

describe("nomeCompletoEhValido", () => {
  it("aceita nome e sobrenome", () => {
    assert.equal(nomeCompletoEhValido("Giovane Oba"), true);
  });

  it("aceita nomes compostos e com acento", () => {
    assert.equal(nomeCompletoEhValido("Gustavo Trovo Ramos de Souza"), true);
    assert.equal(nomeCompletoEhValido("Igor de Araujo Borges"), true);
  });

  it("aceita particulas curtas no meio do nome", () => {
    assert.equal(nomeCompletoEhValido("Ana de Souza"), true);
  });

  it("rejeita apenas um nome", () => {
    assert.equal(nomeCompletoEhValido("Giovane"), false);
    assert.equal(nomeCompletoEhValido("  Giovane  "), false);
  });

  it("rejeita iniciais soltas no lugar de nome ou sobrenome", () => {
    assert.equal(nomeCompletoEhValido("A B"), false);
    assert.equal(nomeCompletoEhValido("Giovane O"), false);
  });

  it("rejeita numeros e simbolos", () => {
    assert.equal(nomeCompletoEhValido("Giovane Oba 2"), false);
    assert.equal(nomeCompletoEhValido("Giovane Oba!"), false);
  });
});

describe("normalizarNome", () => {
  it("remove espacos das pontas e colapsa os do meio", () => {
    assert.equal(normalizarNome("  Giovane   Oba  "), "Giovane Oba");
  });
});
