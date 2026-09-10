import "server-only";

import { lerPerfil, type Perfil } from "@/lib/perfis";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { DadosLogin } from "@/lib/validators/login";

/** UH 04 - Regra de negocio da sessao do usuario. */

export type FalhaLogin = "CREDENCIAIS_INVALIDAS" | "PERFIL_AUSENTE" | "ERRO_INTERNO";

export type ResultadoLogin =
  | { sucesso: true; perfil: Perfil }
  | { sucesso: false; falha: FalhaLogin; mensagem: string };

/**
 * Abre a sessao do usuario.
 *
 * Usa o cliente de servidor porque e ele que grava a sessao nos cookies; com o
 * cliente de navegador o token ficaria so na memoria da aba e o servidor nao
 * reconheceria quem esta autenticado.
 */
export async function entrar(dados: DadosLogin): Promise<ResultadoLogin> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: dados.email,
    password: dados.senha,
  });

  if (error || !data.user) {
    // E-mail inexistente e senha errada devolvem a mesma resposta de proposito:
    // distinguir os dois casos revelaria quais e-mails tem conta na plataforma.
    if (error?.code === "invalid_credentials") {
      return {
        sucesso: false,
        falha: "CREDENCIAIS_INVALIDAS",
        mensagem: "E-mail ou senha incorretos.",
      };
    }

    console.error("[entrar] falha ao autenticar", error);
    return {
      sucesso: false,
      falha: "ERRO_INTERNO",
      mensagem: "Nao foi possivel entrar. Tente novamente.",
    };
  }

  const perfil = lerPerfil(data.user.user_metadata);

  if (!perfil) {
    // Conta sem perfil nao tem para onde ir: encerra a sessao recem-aberta.
    await supabase.auth.signOut();

    return {
      sucesso: false,
      falha: "PERFIL_AUSENTE",
      mensagem:
        "Sua conta esta sem perfil definido. Procure o organizador do evento.",
    };
  }

  return { sucesso: true, perfil };
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
}

/** Usuario da sessao atual, ou `null`. Usado pelas telas protegidas. */
export async function usuarioAtual() {
  const supabase = await criarClienteServidor();

  // `getUser` revalida o token no servidor. `getSession` apenas le o cookie,
  // que pode ter sido adulterado no navegador.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    nome: (user.user_metadata?.nome as string | undefined) ?? "",
    perfil: lerPerfil(user.user_metadata),
  };
}
