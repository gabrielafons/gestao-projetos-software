import { ConfirmacaoEmail } from "@/components/confirmacao-email";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EstruturaPagina,
  DetalhesEvento,
  StatusConviteBadge,
  classeCard,
  classeLink,
} from "@/components/evently-ui";
import { conviteExpirado } from "@/components/evently-formatacao";
import { usuarioAtual } from "@/lib/services/autenticacao";
import { listarMeusConvites } from "@/lib/services/convites";

export default async function PaginaMeusConvites() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login?continuar=%2Fmeus-convites");
  const convites = await listarMeusConvites();
  return (
    <EstruturaPagina
      titulo="Meus convites"
      descricao="Confira seus eventos e acompanhe as respostas dos seus convites."
      organizador={usuario.perfis.includes("organizador")}
    >
      {convites.length === 0 ? (
        <section className={`${classeCard} border-dashed py-10 text-center`}>
          <h2 className="font-semibold">
            Nenhum convite disponível nesta sessão
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-600 dark:text-neutral-400">
            Se recebeu um convite por e-mail, abra o link, verifique seu acesso
            e conclua o cadastro. Mesmo que já tenha cadastro, solicite um novo
            link de acesso pelo convite para autorizar esta sessão.
          </p>
        </section>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {convites.map((convite) => (
            <li key={convite.id} className={classeCard}>
              <h2 className="mb-4 break-words text-lg font-semibold">
                <Link
                  href={`/meus-convites/${convite.id}`}
                  className="hover:underline"
                >
                  {convite.evento.nome}
                </Link>
              </h2>
              <DetalhesEvento evento={convite.evento} />
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StatusConviteBadge status={convite.status} />
                {conviteExpirado(convite.expira_em) && (
                  <span className="text-xs text-red-700 dark:text-red-300">
                    Convite expirado
                  </span>
                )}
              </div>
              {convite.status === "confirmado" && (
                <ConfirmacaoEmail
                  id={convite.id}
                  estado={convite.confirmacao_envio_status}
                  erro={convite.confirmacao_envio_erro}
                />
              )}
              <Link
                href={`/meus-convites/${convite.id}`}
                className={`${classeLink} mt-5 inline-block`}
              >
                Ver convite →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </EstruturaPagina>
  );
}
