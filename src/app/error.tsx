"use client";

import Link from "next/link";
import { classeBotao, classeCard, classeLink } from "@/components/evently-ui";

export default function ErroPagina({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 px-4 py-16">
      <section className={`${classeCard} mx-auto max-w-lg`}>
        <h1 className="text-xl font-semibold">
          Não foi possível carregar esta página
        </h1>
        <p
          role="alert"
          className="mt-3 text-sm text-neutral-600 dark:text-neutral-400"
        >
          Tente novamente em alguns instantes. Se você estava enviando um
          formulário, confira o resultado antes de repetir o envio.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" onClick={reset} className={classeBotao}>
            Tentar novamente
          </button>
          <Link href="/" className={classeLink}>
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}
