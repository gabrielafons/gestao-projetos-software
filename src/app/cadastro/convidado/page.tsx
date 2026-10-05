import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EstruturaPagina,
  classeCard,
  classeLink,
} from "@/components/evently-ui";
import { FormularioCadastroConvidado } from "@/components/evently-formularios";
import { conviteExpirado } from "@/components/evently-formatacao";
import { usuarioAtual } from "@/lib/services/autenticacao";
import { obterConviteCadastro } from "@/lib/services/convites";

export default async function PaginaCadastroConvidado({
  searchParams,
}: {
  searchParams: Promise<{ convite?: string | string[] }>;
}) {
  const parametros = await searchParams;
  const token =
    typeof parametros.convite === "string" ? parametros.convite : null;
  if (!token || !/^[a-f0-9]{64}$/i.test(token))
    return (
      <EstruturaPagina titulo="Convite necessário" autenticado={false}>
        <section className={classeCard}>
          <p className="text-sm">
            Abra o link do convite recebido por e-mail para iniciar seu
            cadastro.
          </p>
        </section>
      </EstruturaPagina>
    );
  const usuario = await usuarioAtual();
  if (!usuario) redirect(`/convite/${token}`);
  const convite = await obterConviteCadastro(token);
  if (!convite || conviteExpirado(convite.expira_em))
    return (
      <EstruturaPagina
        titulo="Não foi possível acessar este cadastro"
        organizador={usuario.perfis.includes("organizador")}
      >
        <section className={classeCard}>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Verifique o acesso pelo e-mail deste convite. Se ele tiver expirado,
            solicite um novo convite ao organizador.
          </p>
          <Link
            href={`/convite/${token}`}
            className={`${classeLink} mt-4 inline-block`}
          >
            Voltar ao convite
          </Link>
        </section>
      </EstruturaPagina>
    );
  return (
    <EstruturaPagina
      titulo="Complete seu cadastro"
      descricao={`Confira seus dados para acessar o convite de ${convite.nome_evento}.`}
      organizador={usuario.perfis.includes("organizador")}
    >
      <section className={classeCard}>
        <FormularioCadastroConvidado
          token={token}
          iniciais={{
            nome: convite.nome_convidado,
            email: convite.email,
            cpf: convite.cpf,
            telefone: convite.telefone,
          }}
        />
      </section>
    </EstruturaPagina>
  );
}
