import "server-only";
import type { User } from "@supabase/supabase-js";
import { lerPerfil, type Perfil } from "@/lib/perfis";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { DadosLogin } from "@/lib/validators/login";
import { FalhaOperacao, falhaBanco } from "./erros";
export type FalhaLogin =
  "CREDENCIAIS_INVALIDAS" | "PERFIL_AUSENTE" | "ERRO_INTERNO";
export type ResultadoLogin =
  | { sucesso: true; perfil: Perfil }
  | { sucesso: false; falha: FalhaLogin; mensagem: string };
// Only getClaims' verified result is authority for the current Auth session.
export async function sessaoVerificada(
  usuarioId: string,
  accessToken?: string,
  cliente?: Awaited<ReturnType<typeof criarClienteServidor>>,
) {
  const db = cliente ?? (await criarClienteServidor());
  const { data, error } = await db.auth.getClaims(accessToken);
  const sessao = data?.claims.session_id;
  if (
    error ||
    data?.claims.sub !== usuarioId ||
    typeof sessao !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      sessao,
    )
  ) {
    throw new FalhaOperacao(
      "SESSAO_AUSENTE",
      401,
      "Entre novamente para continuar.",
    );
  }
  return sessao;
}
async function usuarioComPerfis(user: User) {
  const db = await criarClienteServidor();
  const [organizador, convidado] = await Promise.all([
    db.from("organizadores").select("nome").eq("id", user.id).maybeSingle(),
    db.from("convidados").select("nome").eq("id", user.id).maybeSingle(),
  ]);
  falhaBanco(organizador.error);
  falhaBanco(convidado.error);
  const sessao_id = await sessaoVerificada(user.id);
  const perfis: Perfil[] = [];
  if (organizador.data) perfis.push("organizador");
  if (convidado.data) perfis.push("convidado");
  if (lerPerfil(user.app_metadata) === "operador") perfis.push("operador");
  return {
    id: user.id,
    sessao_id,
    email: user.email ?? "",
    nome: organizador.data?.nome ?? convidado.data?.nome ?? "",
    perfil: perfis[0] ?? null,
    perfis,
    email_verificado: !!user.email_confirmed_at,
  };
}
export async function entrar(dados: DadosLogin): Promise<ResultadoLogin> {
  const db = await criarClienteServidor();
  const { data, error } = await db.auth.signInWithPassword({
    email: dados.email,
    password: dados.senha,
  });
  if (error || !data.user)
    return {
      sucesso: false,
      falha:
        error?.code === "invalid_credentials"
          ? "CREDENCIAIS_INVALIDAS"
          : "ERRO_INTERNO",
      mensagem:
        error?.code === "invalid_credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente.",
    };
  const usuario = await usuarioComPerfis(data.user);
  if (!usuario.perfil) {
    await db.auth.signOut();
    return {
      sucesso: false,
      falha: "PERFIL_AUSENTE",
      mensagem:
        "Para acessar seus convites, abra o convite recebido e solicite um novo link de acesso por e-mail.",
    };
  }
  return { sucesso: true, perfil: usuario.perfil };
}
export async function sair() {
  const db = await criarClienteServidor();
  const { error } = await db.auth.signOut();
  if (error)
    throw new FalhaOperacao(
      "ERRO_INTERNO",
      503,
      "Não foi possível encerrar a sessão. Tente novamente.",
    );
}
export async function usuarioAtual() {
  const db = await criarClienteServidor();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (!user) {
    if (
      error &&
      error.name !== "AuthSessionMissingError" &&
      error.status !== 401 &&
      error.status !== 403
    )
      throw new FalhaOperacao(
        "AUTH_INDISPONIVEL",
        503,
        "Não foi possível verificar sua sessão.",
      );
    return null;
  }
  return usuarioComPerfis(user);
}
export async function exigirUsuario() {
  const user = await usuarioAtual();
  if (!user)
    throw new FalhaOperacao(
      "SESSAO_AUSENTE",
      401,
      "Entre na plataforma para continuar.",
    );
  return user;
}
export async function exigirOrganizador() {
  const user = await exigirUsuario();
  if (!user.perfis.includes("organizador"))
    throw new FalhaOperacao(
      "SEM_PERMISSAO",
      403,
      "Esta ação é exclusiva do organizador.",
    );
  return user;
}
