/**
 * Validacao de CPF pelos digitos verificadores.
 *
 * Checar apenas o tamanho deixaria passar "00000000000" e qualquer sequencia
 * de 11 numeros. A regra oficial confere os dois ultimos digitos a partir dos
 * nove primeiros.
 */

/** Remove pontos, tracos e espacos, deixando apenas digitos. */
export function normalizarCpf(valor: string): string {
  return valor.replace(/\D/g, "");
}

function calcularDigito(digitos: string, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < digitos.length; i += 1) {
    soma += Number(digitos[i]) * (pesoInicial - i);
  }
  const resto = (soma * 10) % 11;
  // Resto 10 e 11 equivalem a digito 0.
  return resto >= 10 ? 0 : resto;
}

export function cpfEhValido(valor: string): boolean {
  const cpf = normalizarCpf(valor);

  if (cpf.length !== 11) return false;

  // Sequencias repetidas (111.111.111-11) passam no calculo, mas nao existem.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const primeiroDigito = calcularDigito(cpf.slice(0, 9), 10);
  if (primeiroDigito !== Number(cpf[9])) return false;

  const segundoDigito = calcularDigito(cpf.slice(0, 10), 11);
  return segundoDigito === Number(cpf[10]);
}

/** Formata para exibicao: 12345678901 -> 123.456.789-01 */
export function formatarCpf(valor: string): string {
  const cpf = normalizarCpf(valor).slice(0, 11);
  return cpf
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
