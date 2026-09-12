import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { destinoSeguro } from "@/lib/navegacao";

const ALTERNATIVA = "/painel";

describe("destinoSeguro", () => {
  it("aceita caminho interno", () => {
    assert.equal(destinoSeguro("/meus-convites", ALTERNATIVA), "/meus-convites");
    assert.equal(
      destinoSeguro("/painel/eventos/7", ALTERNATIVA),
      "/painel/eventos/7",
    );
  });

  it("usa a alternativa quando nao ha destino", () => {
    assert.equal(destinoSeguro(null, ALTERNATIVA), ALTERNATIVA);
    assert.equal(destinoSeguro("", ALTERNATIVA), ALTERNATIVA);
  });

  it("recusa endereco externo", () => {
    assert.equal(destinoSeguro("https://site-falso.com", ALTERNATIVA), ALTERNATIVA);
    assert.equal(destinoSeguro("http://site-falso.com", ALTERNATIVA), ALTERNATIVA);
  });

  it("recusa endereco relativo ao protocolo, que sai do site", () => {
    assert.equal(destinoSeguro("//site-falso.com", ALTERNATIVA), ALTERNATIVA);
    assert.equal(destinoSeguro("/\\site-falso.com", ALTERNATIVA), ALTERNATIVA);
  });

  it("recusa esquema executavel", () => {
    assert.equal(destinoSeguro("javascript:alert(1)", ALTERNATIVA), ALTERNATIVA);
  });

  it("recusa caminho relativo, que depende de onde a pessoa esta", () => {
    assert.equal(destinoSeguro("painel", ALTERNATIVA), ALTERNATIVA);
  });
});
