import type { EstadoEnvio } from "@/types/database";
import { BotaoReenviarConvite } from "@/components/evently-formularios";
const textos = {
  pendente: "E-mail de confirmação aguardando envio.",
  processando: "E-mail de confirmação em processamento.",
  enviado: "E-mail de confirmação enviado.",
  falhou:
    "Falha no envio do e-mail de confirmação. Sua presença continua confirmada.",
};
export function ConfirmacaoEmail({
  id,
  estado,
  erro,
}: {
  id: number;
  estado: EstadoEnvio | null;
  erro?: string | null;
}) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm" role="status">
        {estado
          ? textos[estado]
          : "Envio do e-mail de confirmação ainda não registrado."}
      </p>
      {estado === "falhou" && erro && (
        <p className="text-sm text-red-700 dark:text-red-300">{erro}</p>
      )}
      {(estado === "falhou" || estado === "pendente") && (
        <BotaoReenviarConvite id={id} tipo="confirmacao" />
      )}
    </div>
  );
}
