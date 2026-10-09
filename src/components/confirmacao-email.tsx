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
}: {
  id: number;
  estado: EstadoEnvio | null;
}) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm" role="status">
        {estado
          ? textos[estado]
          : "Envio do e-mail de confirmação ainda não registrado."}
      </p>
      {(estado === "falhou" || estado === "pendente") && (
        <BotaoReenviarConvite id={id} tipo="confirmacao" />
      )}
    </div>
  );
}
