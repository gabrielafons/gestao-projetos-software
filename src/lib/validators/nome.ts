/** Limite de caracteres do nome completo. */
export const TAMANHO_MAXIMO_NOME = 50;

/**
 * Nome completo: ao menos dois nomes.
 *
 * Particulas curtas ("de", "da", "dos") sao aceitas no meio, mas o primeiro e
 * o ultimo nome precisam ter ao menos duas letras — senao "A B" passaria.
 */
export function nomeCompletoEhValido(valor: string): boolean {
  const partes = valor.trim().split(/\s+/).filter(Boolean);

  if (partes.length < 2) return false;
  if (partes.length > 10) return false;

  const apenasLetras = /^[\p{L}'-]+$/u;
  if (!partes.every((parte) => apenasLetras.test(parte))) return false;

  return partes[0].length >= 2 && partes[partes.length - 1].length >= 2;
}

/** Colapsa espacos repetidos, para o nome chegar limpo ao banco. */
export function normalizarNome(valor: string): string {
  return valor.trim().replace(/\s+/g, " ");
}
