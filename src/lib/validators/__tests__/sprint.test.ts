import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { schemaEvento } from "../evento";
import { schemaEmissaoConvite } from "../convite";
import { schemaCadastroConvidado } from "../convidado";
import { schemaRespostaConvite } from "../resposta-convite";
import {
  inicioEvento,
  podeResponder,
  tokenValido,
} from "../../convites-regras";

describe("Sprint 1: contratos de evento e convite", () => {
  it("valida data de calendario, horario e campos do evento", () => {
    assert.equal(
      schemaEvento.safeParse({
        nome: "Evento",
        data: "2027-02-30",
        horario: "14:00",
        local: "Auditório",
      }).success,
      false,
    );
    assert.equal(
      schemaEvento.safeParse({
        nome: "Evento",
        data: "2027-02-28",
        horario: "25:00",
        local: "Auditório",
      }).success,
      false,
    );
    assert.equal(
      schemaEvento.safeParse({
        nome: "Evento",
        data: "2027-02-28",
        horario: "14:00",
        local: "Auditório",
      }).success,
      true,
    );
    assert.equal(schemaEvento.safeParse({}).success, false);
  });
  it("normaliza convite e exige CPF/telefone e evento valido", () => {
    const dados = {
      evento_id: 1,
      nome_convidado: "Maria da Silva",
      email: " MARIA@EXEMPLO.COM ",
      cpf: "529.982.247-25",
      telefone: "(11) 98765-4321",
    };
    const parsed = schemaEmissaoConvite.parse(dados);
    assert.equal(parsed.email, "maria@exemplo.com");
    assert.equal(parsed.cpf, "52998224725");
    assert.equal(
      schemaEmissaoConvite.safeParse({ ...dados, evento_id: 0 }).success,
      false,
    );
    assert.equal(
      schemaEmissaoConvite.safeParse({ ...dados, cpf: "11111111111" }).success,
      false,
    );
  });
  it("cadastro de convidado exige token sem senha e resposta aceita apenas dois estados", () => {
    assert.equal(schemaCadastroConvidado.safeParse({}).success, false);
    assert.equal(
      schemaRespostaConvite.safeParse({ status: "cancelado" }).success,
      false,
    );
    assert.equal(
      schemaRespostaConvite.safeParse({
        status: "confirmado",
        convidado_id: "outro",
      }).success,
      false,
    );
    assert.equal(
      schemaRespostaConvite.safeParse({ status: "recusado" }).success,
      true,
    );
  });
  it("vigencia termina no inicio do evento no fuso de Sao Paulo", () => {
    assert.equal(
      inicioEvento({ data: "2027-02-28", horario: "14:00:00" }).toISOString(),
      "2027-02-28T17:00:00.000Z",
    );
    assert.equal(
      podeResponder(
        { status: "pendente", expira_em: "2027-02-28T17:00:00Z" },
        new Date("2027-02-28T17:00:00Z"),
      ),
      false,
    );
    assert.equal(
      podeResponder(
        { status: "confirmado", expira_em: "2027-02-28T17:00:00Z" },
        new Date("2027-02-28T16:59:59Z"),
      ),
      false,
    );
    assert.equal(podeResponder({ status: "pendente", expira_em: null }), false);
    assert.equal(tokenValido("a".repeat(64)), true);
    assert.equal(tokenValido("1"), false);
  });
});
