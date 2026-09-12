import { avaliarSenha } from "@/lib/validators/senha";

interface RequisitosSenhaProps {
  senha: string;
  /** Id usado pelo campo de senha em `aria-describedby`. */
  id?: string;
}

/**
 * Lista os requisitos de senha forte, marcando os ja atendidos conforme a
 * pessoa digita.
 *
 * A lista aparece desde o inicio, e nao so depois de um erro: e mais util
 * saber o que se espera antes de tentar do que descobrir tentando.
 */
export function RequisitosSenha({ id, senha }: RequisitosSenhaProps) {
  const requisitos = avaliarSenha(senha);
  const atendidos = requisitos.filter((r) => r.atendido).length;

  return (
    <div id={id} className="mt-1">
      <div className="flex items-center gap-2">
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
          role="presentation"
        >
          <div
            className={[
              "h-full rounded-full transition-all duration-300",
              atendidos === requisitos.length
                ? "bg-emerald-500"
                : atendidos >= 3
                  ? "bg-amber-500"
                  : "bg-red-500",
            ].join(" ")}
            style={{ width: `${(atendidos / requisitos.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-neutral-500 tabular-nums">
          {atendidos}/{requisitos.length}
        </span>
      </div>

      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {requisitos.map((requisito) => (
          <li
            key={requisito.id}
            className={[
              "flex items-center gap-1.5 text-xs transition-colors",
              requisito.atendido
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-neutral-500",
            ].join(" ")}
          >
            <span aria-hidden="true" className="w-3 text-center">
              {requisito.atendido ? "✓" : "○"}
            </span>
            <span>{requisito.texto}</span>
            <span className="sr-only">
              {requisito.atendido ? "(atendido)" : "(pendente)"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
