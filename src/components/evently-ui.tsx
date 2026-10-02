import Link from "next/link";
import type { ReactNode } from "react";
import { BotaoSair } from "@/components/botao-sair";
import { dataEvento } from "@/components/evently-formatacao";
import type { Evento, StatusConvite } from "@/types/database";

export const classeBotao =
  "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60";
export const classeLink =
  "text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400";
export const classeCard =
  "rounded-2xl border border-neutral-200 p-5 sm:p-6 dark:border-neutral-800";

export function EstruturaPagina({
  titulo,
  descricao,
  children,
  voltar,
  autenticado = true,
  organizador = false,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
  voltar?: { href: string; texto: string };
  autenticado?: boolean;
  organizador?: boolean;
}) {
  return (
    <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <nav
          aria-label="Navegação principal"
          className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5 dark:border-neutral-800"
        >
          <Link
            href="/"
            className="font-semibold tracking-tight text-indigo-600 dark:text-indigo-400"
          >
            Evently
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            {autenticado ? (
              <>
                {organizador && (
                  <Link href="/painel" className={classeLink}>
                    Meus eventos
                  </Link>
                )}
                <Link href="/meus-convites" className={classeLink}>
                  Meus convites
                </Link>
                <BotaoSair />
              </>
            ) : (
              <Link href="/login" className={classeLink}>
                Entrar
              </Link>
            )}
          </div>
        </nav>
        {voltar && (
          <Link href={voltar.href} className={classeLink}>
            ← {voltar.texto}
          </Link>
        )}
        <header className="mb-8 mt-4">
          <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
            {titulo}
          </h1>
          {descricao && (
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              {descricao}
            </p>
          )}
        </header>
        {children}
      </div>
    </main>
  );
}

export function DetalhesEvento({
  evento,
}: {
  evento: Pick<Evento, "data" | "horario" | "local">;
}) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-3">
      <div>
        <dt className="text-neutral-500 dark:text-neutral-400">Data</dt>
        <dd className="mt-1 font-medium">
          <time dateTime={evento.data}>{dataEvento(evento.data)}</time>
        </dd>
      </div>
      <div>
        <dt className="text-neutral-500 dark:text-neutral-400">Horário</dt>
        <dd className="mt-1 font-medium">{evento.horario.slice(0, 5)}</dd>
      </div>
      <div>
        <dt className="text-neutral-500 dark:text-neutral-400">Local</dt>
        <dd className="mt-1 break-words font-medium">{evento.local}</dd>
      </div>
    </dl>
  );
}

const nomesStatus: Record<StatusConvite, string> = {
  pendente: "Aguardando resposta",
  confirmado: "Presença confirmada",
  recusado: "Convite recusado",
  cancelado: "Convite cancelado",
  transferido: "Convite transferido",
};
export function StatusConviteBadge({ status }: { status: StatusConvite }) {
  const cor =
    status === "confirmado"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : status === "pendente"
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${cor}`}
    >
      {nomesStatus[status]}
    </span>
  );
}

export function Aviso({
  children,
  erro = false,
}: {
  children: ReactNode;
  erro?: boolean;
}) {
  return (
    <p
      role={erro ? "alert" : "status"}
      className={`rounded-lg border px-3 py-3 text-sm ${erro ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"}`}
    >
      {children}
    </p>
  );
}
