import "server-only";

import { criarClienteAdmin } from "@/lib/supabase/admin";
import type { DadosCadastroOrganizador } from "@/lib/validators/organizador";
import type { Organizador } from "@/types/database";

/**
 * UH 01 - Regra de negocio do cadastro de organizador.
 *
 * A logica vive aqui, no codigo da aplicacao — nao em Edge Function nem em
 * trigger de banco. O Route Handler apenas traduz HTTP; quem decide o que
 * acontece e este modulo, que pode ser chamado tambem por um script, um teste
 * ou uma Server Action sem passar por HTTP.
 */

/** Codigos estaveis de falha, para a camada HTTP mapear em status. */
export type FalhaCadastro =
  | "EMAIL_JA_CADASTRADO"
  | "CPF_JA_CADASTRADO"
  | "ERRO_INTERNO";

export type ResultadoCadastro =
  | { sucesso: true; organizador: Organizador }
  | { sucesso: false; falha: FalhaCadastro; mensagem: string };

/** Codigo do Postgres para violacao de restricao UNIQUE. */
const VIOLACAO_DE_UNICIDADE = "23505";

/**
 * Cadastra um organizador: cria a credencial no Supabase Auth e grava o perfil.
 *
 * O cadastro atravessa dois sistemas (Auth e tabela de perfil) que nao
 * compartilham transacao. Se o perfil falhar depois do usuario criado, o
 * usuario orfao e removido — caso contrario o e-mail ficaria preso no Auth,
 * sem perfil, e a pessoa nao conseguiria tentar de novo.
 */
export async function cadastrarOrganizador(
  dados: DadosCadastroOrganizador,
): Promise<ResultadoCadastro> {
  const supabase = criarClienteAdmin();

  // 1. Credencial no Supabase Auth (a senha e armazenada e cifrada por ele).
  const { data: usuarioCriado, error: erroAuth } =
    await supabase.auth.admin.createUser({
      email: dados.email,
      password: dados.senha,
      email_confirm: true,
      // O perfil vai nos metadados para servir de controle de acesso (UH 04 - T3).
      user_metadata: { perfil: "organizador", nome: dados.nome },
    });

  if (erroAuth || !usuarioCriado?.user) {
    if (erroAuth?.code === "email_exists") {
      return {
        sucesso: false,
        falha: "EMAIL_JA_CADASTRADO",
        mensagem: "Ja existe uma conta com este e-mail.",
      };
    }

    console.error("[cadastrarOrganizador] falha ao criar usuario", erroAuth);
    return {
      sucesso: false,
      falha: "ERRO_INTERNO",
      mensagem: "Nao foi possivel concluir o cadastro. Tente novamente.",
    };
  }

  const usuarioId = usuarioCriado.user.id;

  // 2. Perfil do organizador, com o mesmo id do usuario do Auth.
  const { data: organizador, error: erroPerfil } = await supabase
    .from("organizadores")
    .insert({
      id: usuarioId,
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      telefone: dados.telefone,
    })
    .select()
    .single();

  if (erroPerfil || !organizador) {
    // Desfaz o passo 1 para nao deixar credencial sem perfil.
    await supabase.auth.admin.deleteUser(usuarioId);

    if (erroPerfil?.code === VIOLACAO_DE_UNICIDADE) {
      const violou = (alvo: string) =>
        `${erroPerfil.message} ${erroPerfil.details ?? ""}`.includes(alvo);

      if (violou("organizadores_cpf_key")) {
        return {
          sucesso: false,
          falha: "CPF_JA_CADASTRADO",
          mensagem: "Ja existe uma conta com este CPF.",
        };
      }

      return {
        sucesso: false,
        falha: "EMAIL_JA_CADASTRADO",
        mensagem: "Ja existe uma conta com este e-mail.",
      };
    }

    console.error("[cadastrarOrganizador] falha ao gravar perfil", erroPerfil);
    return {
      sucesso: false,
      falha: "ERRO_INTERNO",
      mensagem: "Nao foi possivel concluir o cadastro. Tente novamente.",
    };
  }

  return { sucesso: true, organizador };
}
