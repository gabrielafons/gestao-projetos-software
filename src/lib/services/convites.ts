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