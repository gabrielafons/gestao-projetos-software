export class FalhaOperacao extends Error {
  constructor(
    public codigo: string,
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}
export function falhaBanco(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new FalhaOperacao(
      "DUPLICADO",
      409,
      "Já existe um registro com estes dados.",
    );
  const mensagem = error.message ?? "";
  if (
    /EVENTO_NAO_ENCONTRADO|CONVITE_NAO_ENCONTRADO|CONVITE_NAO_PERTENCE/.test(
      mensagem,
    )
  )
    throw new FalhaOperacao("NAO_ENCONTRADO", 404, "Registro não encontrado.");
  if (/CONVITE_INVALIDO|CONVITE_EXPIRADO|EVENTO_ENCERRADO/.test(mensagem))
    throw new FalhaOperacao(
      "CONVITE_INVALIDO",
      410,
      "Este convite ou evento não está mais disponível.",
    );
  if (mensagem.includes("RESPOSTA_JA_REGISTRADA"))
    throw new FalhaOperacao(
      "RESPOSTA_JA_REGISTRADA",
      409,
      "Sua resposta já foi registrada e não pode ser alterada.",
    );
  if (mensagem.includes("IDENTIDADE_NAO_VERIFICADA"))
    throw new FalhaOperacao(
      "IDENTIDADE_NAO_VERIFICADA",
      403,
      "Confirme seu e-mail antes de continuar.",
    );
  throw new FalhaOperacao(
    "ERRO_INTERNO",
    503,
    "Não foi possível acessar os dados. Tente novamente.",
  );
}
