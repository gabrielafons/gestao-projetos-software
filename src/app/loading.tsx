export default function CarregandoPagina() {
  return (
    <main className="flex-1 px-4 py-16">
      <div className="mx-auto max-w-5xl" role="status" aria-live="polite">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Carregando…
        </p>
      </div>
    </main>
  );
}
