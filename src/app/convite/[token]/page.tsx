import Link from "next/link";
import {
  EstruturaPagina,
  DetalhesEvento,
  classeCard,
  classeBotao,
} from "@/components/evently-ui";
import { BotaoSolicitarAcesso } from "@/components/evently-formularios";
import { conviteExpirado } from "@/components/evently-formatacao";
import {
  obterConvitePublico,
  obterConviteCadastro,
} from "@/lib/services/convites";
import { usuarioAtual } from "@/lib/services/autenticacao";

export default async function PaginaConvitePublico({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const convite = /^[a-f0-9]{64}$/i.test(token)
    ? await obterConvitePublico(token)
    : null;
  if (!convite || conviteExpirado(convite.expira_em))
    return (
      <EstruturaPagina titulo="Convite indisponível" autenticado={false}>
        <section className={classeCard}>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Este convite é inválido, expirou ou não está mais disponível.
            Solicite um novo convite ao organizador do evento.
          </p>
        </section>
      </EstruturaPagina>
    );
  const usuario = await usuarioAtual();
  const cadastro = usuario ? await obterConviteCadastro(token) : null;
  return (
    <EstruturaPagina
      titulo={`Você recebeu um convite para ${convite.nome_evento}`}
      autenticado={false}
      descricao="Confira os detalhes do evento e verifique seu e-mail para acessar o convite nominal."
    >
      <section className={classeCard}>
        <DetalhesEvento evento={convite} />
      </section>
      <section className={`${classeCard} mt-6`}>
        <h2 className="text-lg font-semibold">Acesse seu convite</h2>
        <p className="my-4 text-sm text-neutral-600 dark:text-neutral-400">
          O link de acesso será enviado ao e-mail cadastrado neste convite:{" "}
          <span className="break-all font-medium">
            {convite.email_mascarado}
          </span>
          . Somente quem verificar esse endereço poderá responder.
        </p>
        {cadastro ? (
          <Link
            href={`/cadastro/convidado?convite=${encodeURIComponent(token)}`}
            className={classeBotao}
          >
            Continuar com meu e-mail verificado
          </Link>
        ) : (
          <BotaoSolicitarAcesso token={token} />
        )}
      </section>
    </EstruturaPagina>
  );
}
