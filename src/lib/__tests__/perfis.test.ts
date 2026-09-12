import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ehPerfil, lerPerfil, ROTA_INICIAL } from "@/lib/perfis";

describe("lerPerfil", () => {
  it("le o perfil dos metadados do usuario", () => {
    assert.equal(lerPerfil({ perfil: "organizador" }), "organizador");
    assert.equal(lerPerfil({ perfil: "convidado" }), "convidado");
  });

  it("devolve null quando o perfil nao existe ou nao e conhecido", () => {
    assert.equal(lerPerfil({}), null);
    assert.equal(lerPerfil({ perfil: "administrador" }), null);
    assert.equal(lerPerfil(null), null);
    assert.equal(lerPerfil("organizador"), null);
  });
});

describe("ehPerfil", () => {
  it("reconhece apenas os perfis previstos", () => {
    assert.equal(ehPerfil("operador"), true);
    assert.equal(ehPerfil("visitante"), false);
    assert.equal(ehPerfil(undefined), false);
  });
});

describe("ROTA_INICIAL", () => {
  it("define destino para todos os perfis", () => {
    assert.equal(ROTA_INICIAL.organizador, "/painel");
    assert.equal(ROTA_INICIAL.convidado, "/meus-convites");
    assert.equal(ROTA_INICIAL.operador, "/operacao");
  });
});
