import Link from "next/link";

const RECURSOS = [
  {
    titulo: "Convites nominais",
    texto:
      "Cada convite e emitido no nome do convidado, com codigo de acesso proprio. Desistencias podem ser transferidas a um substituto.",
  },
  {
    titulo: "Trilha de preparo",
    texto:
      "Ao confirmar presenca, o convidado recebe a aula preparatoria e o guia com as informacoes operacionais do evento.",
  },
  {
    titulo: "Presenca efetiva",
    texto:
      "Entrada e saida registradas pela leitura do codigo do participante, apurando quem esteve de fato no evento.",
  },
];

export default function Home() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          Evently
        </p>

        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Gestao de eventos corporativos por convite
        </h1>

        <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
          Organize eventos fechados do convite a apuracao de presenca, com
          material preparatorio liberado para quem confirma.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/cadastro/organizador"
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Criar conta de organizador
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-700 hover:underline dark:text-neutral-300"
          >
            Ja tenho conta
          </Link>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {RECURSOS.map((recurso) => (
            <section key={recurso.titulo}>
              <h2 className="text-sm font-semibold">{recurso.titulo}</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {recurso.texto}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
