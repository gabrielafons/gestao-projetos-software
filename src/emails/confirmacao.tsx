import { Mensagem, type MensagemEmail } from "./mensagem";
export function EmailConfirmacao(
  props: Omit<MensagemEmail, "titulo" | "link">,
) {
  return <Mensagem {...props} titulo="Sua presença está confirmada" />;
}
