export type StatusConvite =
  "pendente" | "confirmado" | "recusado" | "cancelado" | "transferido";
export type EstadoEnvio = "pendente" | "processando" | "enviado" | "falhou";
export type Organizador = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  criado_em: string;
  updated_at: string;
};
export type Convidado = Organizador;
export type Evento = {
  id: number;
  nome: string;
  data: string;
  horario: string;
  local: string;
  organizador_id: string;
  criado_em: string;
  updated_at: string;
};
export type Convite = {
  id: number;
  evento_id: number;
  nome_convidado: string;
  email: string;
  status: StatusConvite;
  codigo: string;
  convidado_id: string | null;
  expira_em: string | null;
  cpf: string | null;
  telefone: string | null;
  token_hash: string | null;
  criado_em: string;
  updated_at: string;
};
export type ConviteLista = Omit<Convite, "token_hash" | "cpf" | "telefone"> & {
  envio_status: EstadoEnvio | null;
  envio_erro: string | null;
  convite_envio_erro: string | null;
  confirmacao_envio_erro: string | null;
  convite_envio_status: EstadoEnvio | null;
  confirmacao_envio_status: EstadoEnvio | null;
};
export type ConviteComEvento = ConviteLista & { evento: Evento };
export type ConvitePublico = {
  id: number;
  nome_evento: string;
  data: string;
  horario: string;
  local: string;
  expira_em: string;
  email_mascarado: string;
};
export type ConviteCadastro = ConvitePublico & {
  nome_convidado: string;
  email: string;
  cpf: string;
  telefone: string;
};
export type Notificacao = {
  id: number;
  convite_id: number;
  tipo: "convite" | "confirmacao" | "acesso";
  chave: string;
  destinatario: string;
  payload: Record<string, string>;
  estado: EstadoEnvio;
  tentativas: number;
  lease: string | null;
  lease_ate: string | null;
  proxima_tentativa: string;
  provedor_id: string | null;
  ultimo_erro: string | null;
  criado_em: string;
  updated_at: string;
};
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};
type Rpc<Args, Returns> = { Args: Args; Returns: Returns };
export type Database = {
  public: {
    Tables: {
      organizadores: Table<
        Organizador,
        Omit<Organizador, "criado_em" | "updated_at">
      >;
      convidados: Table<Convidado, Omit<Convidado, "criado_em" | "updated_at">>;
      eventos: Table<Evento, Omit<Evento, "id" | "criado_em" | "updated_at">>;
      convites: Table<Convite>;
      notificacoes: Table<Notificacao>;
    };
    Views: { [_ in never]: never };
    Functions: {
      emitir_convite: Rpc<
        {
          p_organizador: string;
          p_evento: number;
          p_nome: string;
          p_email: string;
          p_cpf: string;
          p_telefone: string;
          p_codigo: string;
          p_token_hash: string;
          p_token: string;
        },
        Convite
      >;
      cadastrar_convidado: Rpc<
        {
          p_usuario: string;
          p_sessao: string;
          p_token_hash: string;
          p_nome: string;
          p_cpf: string;
          p_telefone: string;
        },
        Convidado
      >;
      responder_convite: Rpc<
        {
          p_usuario: string;
          p_sessao: string;
          p_convite: number;
          p_status: string;
        },
        Convite
      >;
      registrar_prova_postal_com_continuidade: Rpc<
        {
          p_usuario: string;
          p_sessao: string;
          p_convite: number;
          p_sessao_anterior?: string | null;
        },
        undefined
      >;
      registrar_prova_postal: Rpc<
        { p_usuario: string; p_sessao: string; p_convite: number },
        undefined
      >;
      verificar_prova_postal: Rpc<
        { p_usuario: string; p_sessao: string; p_convite: number },
        boolean
      >;
      recuperar_notificacao: Rpc<
        {
          p_usuario: string;
          p_sessao: string;
          p_convite: number;
          p_tipo: "convite" | "confirmacao";
        },
        undefined
      >;
      consumir_limite: Rpc<
        { p_chave: string; p_limite: number; p_segundos: number },
        boolean
      >;
      claim_notificacoes: Rpc<
        { p_limite: number; p_convite?: number },
        Notificacao[]
      >;
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
