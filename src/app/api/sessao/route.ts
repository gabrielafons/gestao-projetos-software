import { NextResponse } from "next/server";

import { ROTA_INICIAL } from "@/lib/perfis";
import { entrar, sair, type FalhaLogin } from "@/lib/services/autenticacao";
import { extrairErrosLogin, schemaLogin } from "@/lib/validators/login";

/**
 * UH 04 - T2 / T5 - Sessao do usuario.
 *
 * POST   /api/sessao  abre a sessao (login)
 * DELETE /api/sessao  encerra a sessao (logout)
 */

const STATUS_POR_FALHA: Record<FalhaLogin, number> = {
  CREDENCIAIS_INVALIDAS: 401,
  PERFIL_AUSENTE: 403,
  ERRO_INTERNO: 500,
};

export async function POST(request: Request) {
  let corpo: unknown;

  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { mensagem: "Corpo da requisicao invalido: esperado JSON." },
      { status: 400 },
    );
  }

  const validacao = schemaLogin.safeParse(corpo);

  if (!validacao.success) {
    return NextResponse.json(
      {
        mensagem: "Verifique os campos destacados.",
        erros: extrairErrosLogin(validacao.error),
      },
      { status: 400 },
    );
  }

  const resultado = await entrar(validacao.data);

  if (!resultado.sucesso) {
    return NextResponse.json(
      { mensagem: resultado.mensagem, codigo: resultado.falha },
      { status: STATUS_POR_FALHA[resultado.falha] },
    );
  }

  return NextResponse.json({
    perfil: resultado.perfil,
    destino: ROTA_INICIAL[resultado.perfil],
  });
}

export async function DELETE() {
  await sair();
  return new NextResponse(null, { status: 204 });
}
