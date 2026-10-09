import { redirect } from "next/navigation";
import { EstruturaPagina, classeCard } from "@/components/evently-ui";
import { usuarioAtual } from "@/lib/services/autenticacao";

export default async function PaginaOperacao() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login?continuar=%2Foperacao");
  if (!usuario.perfis.includes("operador"))
    redirect(
      usuario.perfis.includes("organizador") ? "/painel" : "/meus-convites",
    );
  return (
    <EstruturaPagina
      titulo="Operação de eventos"
      organizador={usuario.perfis.includes("organizador")}
    >
      <section className={classeCard}>
        <h2 className="font-semibold">Área de operação</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Seu acesso está ativo. As ferramentas de entrada e saída de
          participantes estarão disponíveis em uma próxima etapa.
        </p>
      </section>
    </EstruturaPagina>
  );
}
