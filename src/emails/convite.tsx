import { Mensagem, type MensagemEmail } from "./mensagem";
export function EmailConvite(props: Omit<MensagemEmail, "titulo">) {
  return <Mensagem {...props} titulo="Você recebeu um convite" />;
}
