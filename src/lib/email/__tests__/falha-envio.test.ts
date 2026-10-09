import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classificarFalhaEnvio,
  mensagemEnvioSegura,
  FalhaEnvio,
} from "../falha-envio";

test("classifica restrição do remetente de teste Resend com orientação acionável", () => {
  const erro = classificarFalhaEnvio({
    statusCode: 403,
    name: "validation_error",
    message:
      "You can only send testing emails to your own email address (owner@example.test). To send emails to other recipients, please verify a domain.",
  });
  assert.ok(erro instanceof FalhaEnvio);
  assert.equal(erro.codigo, "REMETENTE_TESTE_RESTRITO");
  assert.match(erro.message, /remetente de teste/);
  assert.match(erro.message, /e-mail da conta/);
  assert.match(erro.message, /domínio verificado/);
});

test("falha genérica, transitória e validação não relacionada têm mensagem segura genérica", () => {
  for (const entrada of [
    null,
    undefined,
    new Error("Network failure"),
    { statusCode: 429, name: "rate_limit_exceeded", message: "retry later" },
    { statusCode: 500, name: "application_error" },
    {
      statusCode: 403,
      name: "validation_error",
      message: "unrelated validation",
    },
  ]) {
    const erro = classificarFalhaEnvio(entrada);
    assert.equal(erro.codigo, "ENVIO_INDISPONIVEL");
    assert.match(erro.message, /Não foi possível enviar/);
  }
});

test("erros tipados, serialização e diagnósticos persistidos nunca repassam dados brutos", () => {
  const segredo = "owner@example.test recipient@example.test re_SECRET";
  for (const entrada of [
    new Error(segredo),
    {
      statusCode: 403,
      name: "validation_error",
      message: `You can only send testing emails to your own email address (${segredo})`,
    },
  ]) {
    const erro = classificarFalhaEnvio(entrada);
    assert.doesNotMatch(
      `${erro.message} ${erro.stack} ${JSON.stringify(erro)}`,
      /owner@|recipient@|re_SECRET/,
    );
    assert.equal(erro.cause, undefined);
    assert.equal(classificarFalhaEnvio(erro).codigo, erro.codigo);
    assert.equal(mensagemEnvioSegura(erro.message), erro.message);
  }
  assert.equal(mensagemEnvioSegura(null), null);
  assert.equal(
    mensagemEnvioSegura(segredo),
    classificarFalhaEnvio(null).message,
  );
  const adulterado = new FalhaEnvio("REMETENTE_TESTE_RESTRITO");
  adulterado.message = segredo;
  assert.doesNotMatch(
    classificarFalhaEnvio(adulterado).message,
    /owner@|recipient@|re_SECRET/,
  );
});
