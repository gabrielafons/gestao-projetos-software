import { ConfirmacaoEmail } from "@/components/confirmacao-email";
import { notFound, redirect } from "next/navigation";
import {
  EstruturaPagina,
  DetalhesEvento,
  StatusConviteBadge,
  classeCard,
} from "@/components/evently-ui";
import {
  FormularioConvite,
  BotaoReenviarConvite,
} from "@/components/evently-formularios";
import { conviteExpirado, idPositivo } from "@/components/evently-formatacao";
import { usuarioAtual } from "@/lib/services/autenticacao";
import { obterEvento } from "@/lib/services/eventos";
import { listarConvitesEvento } from "@/lib/services/convites";

const nomesEnvio = {
  pendente: "E-mail aguardando envio",
  processando: "Enviando e-mail",
  enviado: "E-mail enviado",
  falhou: "Falha no envio do e-mail",
};

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: parametro } = await params;
  const id = idPositivo(parametro);
  if (!id) notFound();
  const usuario = await usuarioAtual();
  if (!usuario)
    redirect(`/login?continuar=${encodeURIComponent(`/painel/eventos/${id}`)}`);
  if (!usuario.perfis.includes("organizador")) redirect("/meus-convites");
  const evento = await obterEvento(id);
  if (!evento) notFound();
  const convites = await listarConvitesEvento(id);
  return (
    <EstruturaPagina
      titulo={evento.nome}
      organizador
      voltar={{ href: "/painel", texto: "Meus eventos" }}
    >
      <section className={classeCard} aria-label="Informações do evento">
        <DetalhesEvento evento={evento} />
      </section>
      <section className={`${classeCard} mt-6`}>
        <h2 className="mb-2 text-lg font-semibold">Emitir convite</h2>
        <p className="mb-5 text-sm text-neutral-600 dark:text-neutral-400">
          O convite é nominal. O convidado verificará o e-mail informado para
          acessar e responder.
        </p>
        <FormularioConvite eventoId={evento.id} />
      </section>
      <section className="mt-8" aria-labelledby="titulo-convites">
        <h2 id="titulo-convites" className="mb-4 text-lg font-semibold">
          Convites emitidos{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({convites.length})
          </span>
        </h2>
        <p
          className="mb-4 text-sm text-neutral-600 dark:text-neutral-400"
          aria-label="Resumo das respostas"
        >
          {convites.filter((c) => c.status === "confirmado").length} confirmados
          · {convites.filter((c) => c.status === "recusado").length} recusados ·{" "}
          {convites.filter((c) => c.status === "pendente").length} aguardando
          resposta
        </p>
        {convites.length === 0 ? (
          <div className={`${classeCard} border-dashed`}>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Nenhum convite emitido. Cadastre o primeiro convidado no
              formulário acima.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {convites.map((convite) => {
              const expirado = conviteExpirado(convite.expira_em);
              return (
                <li
                  key={convite.id}
                  className={`${classeCard} flex flex-col justify-between gap-5 sm:flex-row`}
                >
                  <div className="min-w-0 space-y-2">
                    <h3 className="break-words font-semibold">
                      {convite.nome_convidado}
                    </h3>
                    <p className="break-all text-sm text-neutral-600 dark:text-neutral-400">
                      {convite.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusConviteBadge status={convite.status} />
                      {expirado && (
                        <span className="text-xs text-red-700 dark:text-red-300">
                          Convite expirado
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs ${convite.convite_envio_status === "falhou" ? "text-red-700 dark:text-red-300" : "text-neutral-500 dark:text-neutral-400"}`}
                    >
                      {convite.convite_envio_status
                        ? nomesEnvio[convite.convite_envio_status]
                        : "Envio ainda não registrado"}
                    </p>
                    {convite.status === "confirmado" && (
                      <ConfirmacaoEmail
                        id={convite.id}
                        estado={convite.confirmacao_envio_status}
                      />
                    )}
                  </div>
                  {!expirado &&
                    convite.status === "pendente" &&
                    (convite.convite_envio_status === "falhou" ||
                      convite.convite_envio_status === "pendente") && (
                      <div className="sm:max-w-xs">
                        <BotaoReenviarConvite id={convite.id} />
                      </div>
                    )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </EstruturaPagina>
  );
}
