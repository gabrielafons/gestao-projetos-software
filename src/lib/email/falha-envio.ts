const mensagens = {
  REMETENTE_TESTE_RESTRITO:
    "O remetente de teste do Resend só permite enviar para o e-mail da conta Resend. Para enviar a outros destinatários, configure um remetente com domínio verificado.",
  ENVIO_INDISPONIVEL:
    "Não foi possível enviar o e-mail. Verifique a configuração e tente novamente.",
} as const;
export type CodigoFalhaEnvio = keyof typeof mensagens;

// Do not retain provider messages or causes: they can contain emails or secrets.
export class FalhaEnvio extends Error {
  constructor(public readonly codigo: CodigoFalhaEnvio) {
    super(mensagens[codigo]);
    this.name = "FalhaEnvio";
  }
}
export function classificarFalhaEnvio(erro: unknown): FalhaEnvio {
  if (erro instanceof FalhaEnvio) return new FalhaEnvio(erro.codigo);
  if (
    erro &&
    typeof erro === "object" &&
    "name" in erro &&
    "message" in erro &&
    erro.name === "validation_error" &&
    typeof erro.message === "string" &&
    /you can only send testing emails to your own email address/i.test(
      erro.message,
    )
  ) {
    return new FalhaEnvio("REMETENTE_TESTE_RESTRITO");
  }
  return new FalhaEnvio("ENVIO_INDISPONIVEL");
}
// Allowlist even stored values, so old or unexpected raw diagnostics cannot leak.
export function mensagemEnvioSegura(mensagem: string | null): string | null {
  if (!mensagem) return null;
  return mensagem === mensagens.REMETENTE_TESTE_RESTRITO
    ? mensagens.REMETENTE_TESTE_RESTRITO
    : mensagens.ENVIO_INDISPONIVEL;
}
