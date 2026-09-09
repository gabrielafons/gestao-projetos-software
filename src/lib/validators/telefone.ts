/** Remove parenteses, tracos e espacos, deixando apenas digitos. */
export function normalizarTelefone(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Telefone brasileiro com DDD: 10 digitos (fixo) ou 11 (celular). */
export function telefoneEhValido(valor: string): boolean {
  const telefone = normalizarTelefone(valor);
  return /^[1-9][0-9]{9,10}$/.test(telefone);
}

/** Formata para exibicao: 11987654321 -> (11) 98765-4321 */
export function formatarTelefone(valor: string): string {
  const telefone = normalizarTelefone(valor).slice(0, 11);

  if (telefone.length <= 2) return telefone;
  if (telefone.length <= 6) return `(${telefone.slice(0, 2)}) ${telefone.slice(2)}`;

  const corte = telefone.length === 11 ? 7 : 6;
  return `(${telefone.slice(0, 2)}) ${telefone.slice(2, corte)}-${telefone.slice(corte)}`;
}
