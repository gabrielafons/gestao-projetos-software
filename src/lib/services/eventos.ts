import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { DadosEvento } from "@/lib/validators/evento";
import { exigirOrganizador } from "./autenticacao";
import { falhaBanco, FalhaOperacao } from "./erros";
import { inicioEvento } from "@/lib/convites-regras";
export async function listarEventos() {
  const user = await exigirOrganizador();
  const db = await criarClienteServidor();
  const { data, error } = await db
    .from("eventos")
    .select("*")
    .eq("organizador_id", user.id)
    .order("data");
  falhaBanco(error);
  return data ?? [];
}
export async function obterEvento(id: number) {
  const user = await exigirOrganizador();
  const db = await criarClienteServidor();
  const { data, error } = await db
    .from("eventos")
    .select("*")
    .eq("id", id)
    .eq("organizador_id", user.id)
    .maybeSingle();
  falhaBanco(error);
  return data;
}
export async function criarEvento(dados: DadosEvento) {
  const user = await exigirOrganizador();
  if (inicioEvento(dados) <= new Date())
    throw new FalhaOperacao(
      "DATA_PASSADA",
      400,
      "Escolha uma data e horário futuros.",
    );
  const db = await criarClienteServidor();
  const { data, error } = await db
    .from("eventos")
    .insert({ ...dados, organizador_id: user.id })
    .select("*")
    .single();
  falhaBanco(error);
  return data!;
}
