/**
 * Destino interno seguro para redirecionamento.
 *
 * O parametro `continuar` chega pela URL e pode ser escrito por qualquer um:
 * um link como `/login?continuar=https://site-falso.com` levaria a pessoa para
 * fora do Evently logo apos ela digitar a senha, com o link parecendo nosso.
 * Por isso so passam caminhos relativos deste mesmo site.
 */
export function destinoSeguro(valor: string | null, alternativa: string): string {
  if (!valor) return alternativa;

  // Precisa ser um caminho absoluto dentro do site.
  if (!valor.startsWith("/")) return alternativa;

  // "//host" e "/\host" sao lidos por navegadores como endereco externo.
  if (valor.startsWith("//") || valor.startsWith("/\\")) return alternativa;

  return valor;
}
