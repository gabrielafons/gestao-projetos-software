import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
export type MensagemEmail = {
  titulo: string;
  nome?: string;
  evento: string;
  data: string;
  horario: string;
  local: string;
  link?: string;
  acao?: string;
};
export function Mensagem({
  titulo,
  nome,
  evento,
  data,
  horario,
  local,
  link,
  acao,
}: MensagemEmail) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {titulo} — {evento}
      </Preview>
      <Body
        style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5" }}
      >
        <Container
          style={{
            backgroundColor: "#fff",
            padding: "32px",
            maxWidth: "560px",
          }}
        >
          <Text>Evently</Text>
          <Heading>{titulo}</Heading>
          {nome && <Text>Olá, {nome}.</Text>}
          <Text>
            <strong>{evento}</strong>
          </Text>
          <Text>
            {data} às {horario.slice(0, 5)} (horário de Brasília)
          </Text>
          <Text>Local: {local}</Text>
          {link && (
            <Text>
              <Link href={link}>{acao ?? "Acessar convite"}</Link>
            </Text>
          )}
          <Text>
            Este convite é nominal. Confirme seu e-mail para acessar a
            plataforma.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
