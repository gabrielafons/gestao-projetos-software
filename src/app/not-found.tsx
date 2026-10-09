import Link from "next/link";
import { classeCard, classeLink } from "@/components/evently-ui";

export default function PaginaNaoEncontrada() {
  return (
    <main className="flex-1 px-4 py-16">
      <section className={`${classeCard} mx-auto max-w-lg`}>
        <h1 className="text-xl font-semibold">Página indisponível</h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          Este item não foi encontrado ou não está disponível para a sua conta.
        </p>
        <Link href="/" className={`${classeLink} mt-6 inline-block`}>
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
