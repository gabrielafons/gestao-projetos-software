/** Tipos do banco, espelhando as migrations em `supabase/migrations/`. */

/** Ciclo de vida de um convite (UH 05, UH 06 e UH 10). */
export type StatusConvite =
  | "pendente"
  | "confirmado"
  | "recusado"
  | "cancelado"
  | "transferido";

export type Organizador = {
  /** Mesmo id do usuario em `auth.users`. */
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  criado_em: string;
  updated_at: string;
};

export type Convidado = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  criado_em: string;
  updated_at: string;
};

export type Evento = {
  id: number;
  nome: string;
  /** Formato ISO `YYYY-MM-DD`. */
  data: string;
  /** Formato `HH:MM:SS`. */
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
  criado_em: string;
  updated_at: string;
};

/**
 * Contrato que o cliente Supabase usa para tipar queries.
 *
 * Precisa ser `type`, e nao `interface`: o supabase-js exige que o schema seja
 * atribuivel a `Record<string, GenericTable>`, e so type aliases recebem a
 * index signature implicita.
 */
export type Database = {
  public: {
    Tables: {
      organizadores: {
        Row: Organizador;
        Insert: Omit<Organizador, "criado_em" | "updated_at">;
        Update: Partial<Omit<Organizador, "id">>;
        Relationships: [];
      };
      convidados: {
        Row: Convidado;
        Insert: Omit<Convidado, "criado_em" | "updated_at">;
        Update: Partial<Omit<Convidado, "id">>;
        Relationships: [];
      };
      eventos: {
        Row: Evento;
        Insert: Omit<Evento, "id" | "criado_em" | "updated_at">;
        Update: Partial<Omit<Evento, "id" | "organizador_id">>;
        Relationships: [];
      };
      convites: {
        Row: Convite;
        Insert: Omit<
          Convite,
          "id" | "criado_em" | "updated_at" | "status" | "convidado_id" | "expira_em"
        > & {
          status?: StatusConvite;
          convidado_id?: string | null;
          expira_em?: string | null;
        };
        Update: Partial<Omit<Convite, "id" | "evento_id">>;
        Relationships: [];
      };
    };
    // Objeto sem chaves. `Record<string, never>` nao serve: o supabase-js
    // intersecta Tables com Views, e a index signature zera os tipos.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
