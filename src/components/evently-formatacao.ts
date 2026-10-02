export function dataEvento(data: string): string {
  const valor = new Date(`${data}T12:00:00Z`);
  return Number.isNaN(valor.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(valor);
}

export function conviteExpirado(
  expiraEm: string | null,
  agora = Date.now(),
): boolean {
  if (!expiraEm) return false;
  const instante = Date.parse(expiraEm);
  return Number.isNaN(instante) || instante <= agora;
}

export function idPositivo(valor: string): number | null {
  if (!/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
