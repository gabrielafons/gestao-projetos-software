import type { InputHTMLAttributes } from "react";

interface CampoFormularioProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  rotulo: string;
  /** Mensagem de erro do campo. Quando presente, o campo entra em estado de erro. */
  erro?: string;
  /** Marca o campo como validado, exibindo o check. */
  valido?: boolean;
  /** Texto de apoio exibido quando nao ha erro. */
  ajuda?: string;
}

/** Campo de formulario com rotulo, estados de erro e de validado. */
export function CampoFormulario({
  id,
  rotulo,
  erro,
  valido = false,
  ajuda,
  className = "",
  ...props
}: CampoFormularioProps) {
  const idDescricao = erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
        {props.required && (
          <span className="text-red-600 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={idDescricao}
          className={[
            "w-full rounded-lg border py-2 pl-3 text-sm outline-none transition",
            // Espaco a direita reservado para o check, para o texto nao passar por baixo dele.
            valido && !erro ? "pr-9" : "pr-3",
            "bg-white dark:bg-neutral-900",
            "focus:ring-2 focus:ring-offset-0",
            erro
              ? "border-red-500 focus:ring-red-500/40"
              : valido
                ? "border-emerald-500 focus:ring-emerald-500/30"
                : "border-neutral-300 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500/30",
            className,
          ].join(" ")}
          {...props}
        />

        {valido && !erro && (
          <span
            className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          >
            ✓
          </span>
        )}
      </div>

      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-xs text-red-600">
          {erro}
        </p>
      ) : ajuda ? (
        <p id={`${id}-ajuda`} className="text-xs text-neutral-500">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}
