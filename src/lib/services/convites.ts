import "server-only";
import { randomUUID } from "node:crypto";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import {
  conviteVigente,
  mascararEmail,
  tokenValido,
} from "@/lib/convites-regras";
import type {
  Convite,
  ConviteLista,
  ConvitePublico,
  ConviteCadastro,
  ConviteComEvento,
} from "@/types/database";
import type { DadosEmissaoConvite } from "@/lib/validators/convite";
import type { DadosConvidado } from "@/lib/validators/convidado";
import {
  exigirUsuario,
  exigirOrganizador,
  sessaoVerificada,
} from "./autenticacao";
import { obterEvento } from "./eventos";
import { falhaBanco, FalhaOperacao } from "./erros";
import { criarToken, hashToken } from "./tokens";
import { processarNotificacoes, estadoEnvio } from "./notificacoes";
async function estadosEnvio(id: number) {
  const [convite_envio_status, confirmacao_envio_status] = await Promise.all([
    estadoEnvio(id),
    estadoEnvio(id, "confirmacao"),
  ]);
  return {
    envio_status: convite_envio_status,
    convite_envio_status,
    confirmacao_envio_status,
  };
}
const CAMPOS =
  "id,evento_id,nome_convidado,email,status,codigo,convidado_id,expira_em,criado_em,updated_at" as const;
export async function listarMeusConvites(): Promise<ConviteComEvento[]> {
  const user = await exigirUsuario();
  const db = await criarClienteServidor();
  const { data, error } = await db
    .from("convites")
    .select(CAMPOS)
    .eq("convidado_id", user.id)
    .order("id");
  falhaBanco(error);
  const ids = [...new Set((data ?? []).map((c) => c.evento_id))];
  if (!ids.length) return [];
  const { data: eventos, error: err } = await db
    .from("eventos")
    .select("*")
    .in("id", ids);
  falhaBanco(err);
  return Promise.all(
    (data ?? [])
      .flatMap((c) => {
        const evento = eventos?.find((e) => e.id === c.evento_id);
        return evento ? [{ ...c, evento }] : [];
      })
      .map(async (c) => ({ ...c, ...(await estadosEnvio(c.id)) })),
  );
}
export async function obterMeuConvite(id: number) {
  return (await listarMeusConvites()).find((c) => c.id === id) ?? null;
}
async function convitePorToken(token: string) {
  if (!tokenValido(token)) return null;
  const db = criarClienteAdmin();
  const { data: c, error } = await db
    .from("convites")
    .select("*")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  falhaBanco(error);
  if (!c || !conviteVigente(c)) return null;
  const { data: evento, error: err } = await db
    .from("eventos")
    .select("*")
    .eq("id", c.evento_id)
    .single();
  falhaBanco(err);
  return evento ? { c, evento } : null;
}
export async function obterConvitePublico(
  token: string,
): Promise<ConvitePublico | null> {
  const registro = await convitePorToken(token);
  if (!registro) return null;
  const { c, evento } = registro;
  return {
    id: c.id,
    nome_evento: evento.nome,
    data: evento.data,
    horario: evento.horario,
    local: evento.local,
    expira_em: c.expira_em!,
    email_mascarado: mascararEmail(c.email),
  };
}
export async function obterConviteCadastro(
  token: string,
): Promise<ConviteCadastro | null> {
  const user = await exigirUsuario();
  const registro = await convitePorToken(token);
  if (
    !registro ||
    !user.email_verificado ||
    user.email.toLowerCase() !== registro.c.email.toLowerCase()
  )
    return null;
  const { c } = registro;
  if (c.convidado_id && c.convidado_id !== user.id) return null;
  if (!(await temProva(user, c.id))) return null;
  return {
    ...(await obterConvitePublico(token))!,
    nome_convidado: c.nome_convidado,
    email: c.email,
    cpf: c.cpf ?? "",
    telefone: c.telefone ?? "",
  };
}
function semSegredos(c: Convite) {
  return {
    id: c.id,
    evento_id: c.evento_id,
    nome_convidado: c.nome_convidado,
    email: c.email,
    status: c.status,
    codigo: c.codigo,
    convidado_id: c.convidado_id,
    expira_em: c.expira_em,
  };
}
export async function solicitarAcesso(token: string) {
  const registro = await convitePorToken(token);
  if (!registro)
    throw new FalhaOperacao(
      "CONVITE_INVALIDO",
      410,
      "Convite inválido ou expirado.",
    );
  const { c, evento } = registro;
  const admin = criarClienteAdmin();
  const { data: permitido, error: limite } = await admin.rpc(
    "consumir_limite",
    { p_chave: `convite:${hashToken(token)}`, p_limite: 3, p_segundos: 300 },
  );
  falhaBanco(limite);
  if (!permitido)
    throw new FalhaOperacao(
      "LIMITE",
      429,
      "Aguarde alguns minutos antes de solicitar outro acesso.",
    );
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: c.email,
  });
  if (error || !data?.properties?.hashed_token)
    throw new FalhaOperacao(
      "AUTH_INDISPONIVEL",
      503,
      "Não foi possível enviar o acesso. Tente novamente.",
    );
  const { data: notification, error: err } = await admin
    .from("notificacoes")
    .insert({
      convite_id: c.id,
      tipo: "acesso",
      chave: `acesso:${randomUUID()}`,
      destinatario: c.email,
      payload: {
        token,
        token_hash: data.properties.hashed_token,
        nome: c.nome_convidado,
        evento: evento.nome,
        data: evento.data,
        horario: evento.horario,
        local: evento.local,
        gerado_em: String(Date.now()),
      },
    })
    .select("id")
    .single();
  falhaBanco(err);
  await processarNotificacoes(c.id);
  const { data: n, error: erro } = await admin
    .from("notificacoes")
    .select("estado")
    .eq("id", notification!.id)
    .single();
  falhaBanco(erro);
  if (n?.estado !== "enviado")
    throw new FalhaOperacao(
      "EMAIL_INDISPONIVEL",
      503,
      "O e-mail de acesso está pendente. Tente novamente em instantes.",
    );
}
export async function confirmarAcesso(token_hash: string, convite: string) {
  const registro = await convitePorToken(convite);
  if (!registro)
    throw new FalhaOperacao(
      "CONVITE_INVALIDO",
      410,
      "Convite inválido ou expirado.",
    );
  const db = await criarClienteServidor();
  // Capture only this browser's verified session before OTP rotates its cookies.
  // Never discover prior proofs by user id or accept a session id from the request.
  const { data: anterior, error: erroAnterior } = await db.auth.getUser();
  if (
    erroAnterior &&
    erroAnterior.name !== "AuthSessionMissingError" &&
    erroAnterior.status !== 401 &&
    erroAnterior.status !== 403
  ) {
    throw new FalhaOperacao(
      "AUTH_INDISPONIVEL",
      503,
      "Não foi possível verificar sua sessão. Tente novamente.",
    );
  }
  const sessaoAnterior =
    !erroAnterior && anterior.user
      ? {
          usuario: anterior.user.id,
          sessao: await sessaoVerificada(anterior.user.id, undefined, db),
        }
      : null;
  const { data, error } = await db.auth.verifyOtp({
    type: "email",
    token_hash,
  });
  if (error || !data.user || !data.session)
    throw new FalhaOperacao(
      "LINK_INVALIDO",
      401,
      "Link de acesso inválido ou expirado. Solicite outro pelo convite.",
    );
  if (
    !data.user.email_confirmed_at ||
    data.user.email?.toLowerCase() !== registro.c.email.toLowerCase()
  ) {
    await db.auth.signOut();
    throw new FalhaOperacao(
      "SEM_PERMISSAO",
      403,
      "Este acesso não corresponde ao convite.",
    );
  }
  const sessao = await sessaoVerificada(
    data.user.id,
    data.session.access_token,
    db,
  );
  const { error: provaError } = await criarClienteAdmin().rpc(
    "registrar_prova_postal_com_continuidade",
    {
      p_usuario: data.user.id,
      p_sessao: sessao,
      p_convite: registro.c.id,
      p_sessao_anterior:
        sessaoAnterior?.usuario === data.user.id ? sessaoAnterior.sessao : null,
    },
  );
  falhaBanco(provaError);
  return `/cadastro/convidado?convite=${convite}`;
}
