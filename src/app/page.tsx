import Link from "next/link";

const RECURSOS = [
  {
    titulo: "Eventos em um só lugar",
    texto:
      "Cadastre nome, data, horário e local. Gerencie os convidados de cada evento pelo seu painel.",
  },
  {
    titulo: "Convites nominais",
    texto:
      "Envie convites por e-mail para as pessoas certas. Cada convidado verifica seu endereço antes de acessar.",
  },
  {
    titulo: "Respostas acompanhadas",
    texto:
      "Saiba quem confirmou, quem recusou e quem ainda precisa responder. Confira também o status de envio de cada convite.",
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
          Gestão de eventos corporativos por convite
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
          Crie seu evento, envie convites nominais e acompanhe as confirmações
          em um único lugar.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/cadastro/organizador"
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Criar conta de organizador
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-700 hover:underline dark:text-neutral-300"
          >
            Já tenho conta
          </Link>
        </div>
        <div className="mt-8 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">Recebeu um convite?</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Abra o link recebido por e-mail para verificar seu acesso e
            responder. Se já concluiu seu cadastro,{" "}
            <Link
              href="/meus-convites"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              acesse seus convites
            </Link>
            .
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
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
