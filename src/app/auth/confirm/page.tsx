"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ConfirmarAcesso } from "@/components/evently-formularios";
import {
  EstruturaPagina,
  classeCard,
  classeLink,
} from "@/components/evently-ui";

function Confirmacao() {
  const parametros = useSearchParams();
  const convite = parametros.get("convite");
  const tokenValido = convite && /^[a-f0-9]{64}$/i.test(convite);
  return (
    <section className={`${classeCard} max-w-xl`}>
      <ConfirmarAcesso
        tokenHash={parametros.get("token_hash")}
        convite={convite}
      />
      {tokenValido && (
        <Link
          href={`/convite/${convite}`}
          className={`${classeLink} mt-5 inline-block`}
        >
          Voltar ao convite ou solicitar novo acesso
        </Link>
      )}
    </section>
  );
}

export default function PaginaConfirmacao() {
  return (
    <EstruturaPagina titulo="Confirmar acesso ao convite" autenticado={false}>
      <Suspense fallback={<p role="status">Carregando link de acesso…</p>}>
        <Confirmacao />
      </Suspense>
    </EstruturaPagina>
  );
}
