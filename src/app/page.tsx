import Link from "next/link";

/**
 * Home do Evently.
 *
 * Porta de entrada do setup inicial: apresenta o produto e leva ao unico
 * fluxo ja implementado ponta a ponta (cadastro de organizador, UH 01).
 */
export default function Home() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          Evently
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Gestao de eventos corporativos por convite
        </h1>

        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          Convites nominais, trilha de material preparatorio liberada na
          confirmacao de presenca, controle de entrada e saida por codigo unico
          e quiz com brinde para os participantes.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/cadastro/organizador"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Criar conta de organizador
          </Link>
        </div>

        <section className="mt-12 rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Sprint 1 — setup inicial
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>Next.js (React + TypeScript) sobre Node.js</li>
            <li>Supabase Auth e tabelas de organizador, convidado, evento e convite</li>
            <li>Cadastro de organizador: endpoint, validacao e formulario</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
