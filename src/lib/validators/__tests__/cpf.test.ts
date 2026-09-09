import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cpfEhValido, formatarCpf, normalizarCpf } from "@/lib/validators/cpf";

describe("normalizarCpf", () => {
  it("remove a pontuacao e mantem apenas digitos", () => {
    assert.equal(normalizarCpf("529.982.247-25"), "52998224725");
  });
});

describe("cpfEhValido", () => {
  it("aceita CPF com digitos verificadores corretos", () => {
    assert.equal(cpfEhValido("529.982.247-25"), true);
    assert.equal(cpfEhValido("52998224725"), true);
  });

  it("rejeita CPF com digito verificador errado", () => {
    assert.equal(cpfEhValido("529.982.247-24"), false);
  });

  it("rejeita sequencias repetidas, que passam no calculo mas nao existem", () => {
    assert.equal(cpfEhValido("111.111.111-11"), false);
    assert.equal(cpfEhValido("00000000000"), false);
  });

  it("rejeita CPF com quantidade de digitos diferente de 11", () => {
    assert.equal(cpfEhValido("529982247"), false);
    assert.equal(cpfEhValido("529982247250"), false);
    assert.equal(cpfEhValido(""), false);
  });
});

describe("formatarCpf", () => {
  it("formata progressivamente conforme a digitacao", () => {
    assert.equal(formatarCpf("529"), "529");
    assert.equal(formatarCpf("529982"), "529.982");
    assert.equal(formatarCpf("52998224725"), "529.982.247-25");
  });

  it("descarta digitos alem do 11o", () => {
    assert.equal(formatarCpf("5299822472599"), "529.982.247-25");
  });
});
