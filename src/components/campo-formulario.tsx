import type { InputHTMLAttributes } from "react";

interface CampoFormularioProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  rotulo: string;
  /** Mensagem de erro do campo. Quando presente, o campo entra em estado de erro. */
  erro?: string;
  /** Texto de apoio exibido quando nao ha erro. */
  ajuda?: string;
}

/** Campo de formulario com rotulo, estado de erro e acessibilidade. */
export function CampoFormulario({
  id,
  rotulo,
  erro,
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

      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={idDescricao}
        className={[
          "rounded-lg border px-3 py-2 text-sm outline-none transition",
          "bg-white dark:bg-neutral-900",
          "focus:ring-2 focus:ring-offset-0",
          erro
            ? "border-red-500 focus:ring-red-500/40"
            : "border-neutral-300 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500/30",
          className,
        ].join(" ")}
        {...props}
      />

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
