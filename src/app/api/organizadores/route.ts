import { NextResponse } from "next/server";

import {
  cadastrarOrganizador,
  type FalhaCadastro,
} from "@/lib/services/organizadores";
import {
  extrairErrosPorCampo,
  schemaCadastroOrganizador,
} from "@/lib/validators/organizador";

/**
 * UH 01 - T2 - Endpoint de cadastro de organizador.
 *
 * POST /api/organizadores
 *
 * Esta camada so cuida de HTTP: le o corpo, valida o formato, delega a regra
 * de negocio para o servico e traduz o resultado em status. Nenhuma decisao de
 * dominio acontece aqui.
 */

/** Cada falha do dominio tem um status HTTP correspondente. */
const STATUS_POR_FALHA: Record<FalhaCadastro, number> = {
  EMAIL_JA_CADASTRADO: 409,
  CPF_JA_CADASTRADO: 409,
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

  // Cenario 2 da UH 01: dados obrigatorios ausentes ou invalidos.
  const validacao = schemaCadastroOrganizador.safeParse(corpo);

  if (!validacao.success) {
    return NextResponse.json(
      {
        mensagem: "Verifique os campos destacados.",
        erros: extrairErrosPorCampo(validacao.error),
      },
      { status: 400 },
    );
  }

  const resultado = await cadastrarOrganizador(validacao.data);

  if (!resultado.sucesso) {
    return NextResponse.json(
      { mensagem: resultado.mensagem, codigo: resultado.falha },
      { status: STATUS_POR_FALHA[resultado.falha] },
    );
  }

  // Cenario 1 da UH 01: cadastro realizado com sucesso.
  const { organizador } = resultado;

  return NextResponse.json(
    {
      mensagem: "Cadastro realizado com sucesso.",
      organizador: {
        id: organizador.id,
        nome: organizador.nome,
        email: organizador.email,
      },
    },
    { status: 201 },
  );
}
