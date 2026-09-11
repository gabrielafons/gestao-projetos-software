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
const CAMPOS =
  "id,evento_id,nome_convidado,email,status,codigo,convidado_id,expira_em,criado_em,updated_at" as const;
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