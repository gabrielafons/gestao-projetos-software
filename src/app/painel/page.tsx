import { redirect } from "next/navigation";

import { BotaoSair } from "@/components/botao-sair";
import { usuarioAtual } from "@/lib/services/autenticacao";

/**
 * Area do organizador.
 *
 * O middleware ja barra quem nao tem sessao; a checagem de perfil aqui e a
 * segunda camada, para um convidado autenticado nao alcancar a area de quem
 * organiza apenas digitando a URL.
 */
export default async function PaginaPainel() {
  const usuario = await usuarioAtual();

  if (!usuario) redirect("/login");
  if (usuario.perfil !== "organizador") redirect("/");

  const primeiroNome = usuario.nome.split(" ")[0] || "organizador";

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Evently
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Ola, {primeiroNome}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {usuario.email}
            </p>
          </div>

          <BotaoSair />
        </div>

        <section className="mt-12 rounded-2xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
          <h2 className="text-sm font-medium">Nenhum evento por aqui ainda</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
            Quando voce criar um evento, ele aparece nesta lista com os convites
            emitidos e a presenca confirmada.
          </p>
        </section>
      </div>
    </main>
  );
}
