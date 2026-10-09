import { ConfirmacaoEmail } from "@/components/confirmacao-email";
import { notFound, redirect } from "next/navigation";
import {
  EstruturaPagina,
  DetalhesEvento,
  StatusConviteBadge,
  classeCard,
} from "@/components/evently-ui";
import { ResponderConvite } from "@/components/evently-formularios";
import { conviteExpirado, idPositivo } from "@/components/evently-formatacao";
import { usuarioAtual } from "@/lib/services/autenticacao";
import { obterMeuConvite } from "@/lib/services/convites";

export default async function PaginaMeuConvite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: parametro } = await params;
  const id = idPositivo(parametro);
  if (!id) notFound();
  const usuario = await usuarioAtual();
  if (!usuario)
    redirect(`/login?continuar=${encodeURIComponent(`/meus-convites/${id}`)}`);
  const convite = await obterMeuConvite(id);
  if (!convite) notFound();
  const expirado = conviteExpirado(convite.expira_em);
  return (
    <EstruturaPagina
      titulo={convite.evento.nome}
      descricao="Seu convite nominal para este evento."
      organizador={usuario.perfis.includes("organizador")}
      voltar={{ href: "/meus-convites", texto: "Meus convites" }}
    >
      <section className={classeCard}>
        <DetalhesEvento evento={convite.evento} />
      </section>
      <section className={`${classeCard} mt-6`}>
        <h2 className="mb-4 text-lg font-semibold">Seu convite</h2>
        <p className="mb-4 break-words text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">
            Convidado:{" "}
          </span>
          {convite.nome_convidado}
        </p>
        <StatusConviteBadge status={convite.status} />
        {convite.status === "confirmado" && (
          <ConfirmacaoEmail
            id={convite.id}
            estado={convite.confirmacao_envio_status}
            erro={convite.confirmacao_envio_erro}
          />
        )}
        {expirado && (
          <p className="mt-4 text-sm text-red-700 dark:text-red-300">
            Este convite expirou. Não é mais possível registrar uma resposta.
            Entre em contato com o organizador.
          </p>
        )}
        {convite.status === "pendente" && !expirado ? (
          <div className="mt-6">
            <ResponderConvite id={convite.id} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            {convite.status === "confirmado"
              ? "Sua presença está confirmada. Consulte a data, o horário e o local acima."
              : convite.status === "recusado"
                ? "Sua recusa foi registrada. Você pode consultar os detalhes do evento nesta página."
                : convite.status !== "pendente"
                  ? "Este convite não aceita novas respostas."
                  : ""}
          </p>
        )}
      </section>
    </EstruturaPagina>
  );
}
