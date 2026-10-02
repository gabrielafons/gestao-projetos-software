import { redirect } from "next/navigation";
import { EstruturaPagina, classeCard } from "@/components/evently-ui";
import { FormularioEvento } from "@/components/evently-formularios";
import { usuarioAtual } from "@/lib/services/autenticacao";

export default async function PaginaNovoEvento() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login?continuar=%2Fpainel%2Feventos%2Fnovo");
  if (!usuario.perfis.includes("organizador")) redirect("/meus-convites");
  return (
    <EstruturaPagina
      titulo="Criar evento"
      descricao="Preencha os dados que os convidados receberão no convite."
      organizador
      voltar={{ href: "/painel", texto: "Meus eventos" }}
    >
      <section className={classeCard}>
        <FormularioEvento />
      </section>
    </EstruturaPagina>
  );
}
