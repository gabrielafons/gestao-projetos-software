import assert from "node:assert/strict";
import { test } from "node:test";
import { dataEvento, conviteExpirado, idPositivo } from "./evently-formatacao";

test("data civil do evento não muda com o fuso horário", () => {
  assert.equal(dataEvento("2026-10-09"), "09/10/2026");
});

test("expiração inclui o instante limite e rejeita datas inválidas", () => {
  const agora = Date.parse("2026-10-09T12:00:00Z");
  assert.equal(conviteExpirado("2026-10-09T12:00:00Z", agora), true);
  assert.equal(conviteExpirado("2026-10-09T12:01:00Z", agora), false);
  assert.equal(conviteExpirado("inválida", agora), true);
  assert.equal(conviteExpirado(null, agora), false);
});

test("IDs de página aceitam apenas inteiros positivos seguros", () => {
  assert.equal(idPositivo("12"), 12);
  for (const valor of ["0", "-1", "1.2", "1e3", "", "9007199254740992"]) {
    assert.equal(idPositivo(valor), null);
  }
});
