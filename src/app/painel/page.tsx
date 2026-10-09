import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EstruturaPagina,
  DetalhesEvento,
  classeBotao,
  classeCard,
  classeLink,
} from "@/components/evently-ui";
import { usuarioAtual } from "@/lib/services/autenticacao";
import { listarEventos } from "@/lib/services/eventos";

export default async function PaginaPainel() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login?continuar=%2Fpainel");
  if (!usuario.perfis.includes("organizador")) redirect("/meus-convites");
  const eventos = await listarEventos();
  return (
    <EstruturaPagina
      titulo={`Olá, ${usuario.nome.split(" ")[0] || "organizador"}`}
      descricao="Crie eventos, envie convites nominais e acompanhe as respostas."
      organizador
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          Meus eventos{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({eventos.length})
          </span>
        </h2>
        <Link href="/painel/eventos/novo" className={classeBotao}>
          Criar evento
        </Link>
      </div>
      {eventos.length === 0 ? (
        <section className={`${classeCard} border-dashed py-10 text-center`}>
          <h3 className="font-medium">Seu primeiro evento começa aqui</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
            Informe o nome, a data e o local do evento. Depois, você poderá
            emitir os convites e acompanhar as confirmações.
          </p>
          <Link
            href="/painel/eventos/novo"
            className={`${classeLink} mt-5 inline-block`}
          >
            Criar meu primeiro evento →
          </Link>
        </section>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {eventos.map((evento) => (
            <li key={evento.id} className={classeCard}>
              <h3 className="mb-4 break-words text-lg font-semibold">
                <Link
                  href={`/painel/eventos/${evento.id}`}
                  className="hover:text-indigo-600 hover:underline"
                >
                  {evento.nome}
                </Link>
              </h3>
              <DetalhesEvento evento={evento} />
              <Link
                href={`/painel/eventos/${evento.id}`}
                className={`${classeLink} mt-5 inline-block`}
              >
                Gerenciar convites →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </EstruturaPagina>
  );
}
