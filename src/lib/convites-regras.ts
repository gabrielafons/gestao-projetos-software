import type { StatusConvite } from "@/types/database";
export function inicioEvento(evento: { data: string; horario: string }) {
  return new Date(
    `${evento.data}T${evento.horario.length === 5 ? `${evento.horario}:00` : evento.horario}-03:00`,
  );
}
export function tokenValido(token: string) {
  return /^[a-f0-9]{64}$/.test(token);
}
export function conviteVigente(
  convite: { status: StatusConvite; expira_em: string | null },
  agora = new Date(),
) {
  return (
    !!convite.expira_em &&
    new Date(convite.expira_em) > agora &&
    !["cancelado", "transferido"].includes(convite.status)
  );
}
export function podeResponder(
  convite: { status: StatusConvite; expira_em: string | null },
  agora = new Date(),
) {
  return convite.status === "pendente" && conviteVigente(convite, agora);
}
export function mascararEmail(email: string) {
  const [nome, dominio] = email.split("@");
  return `${nome.slice(0, 1)}***@${dominio}`;
}
