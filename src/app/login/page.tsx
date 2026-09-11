"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { CampoFormulario } from "@/components/campo-formulario";
import {
  extrairErrosLogin,
  schemaLogin,
  type ErrosLogin,
} from "@/lib/validators/login";

/** UH 04 - T4 - Tela de login por e-mail e senha. */
function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<ErrosLogin>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    const validacao = schemaLogin.safeParse({ email, senha });

    if (!validacao.success) {
      setErros(extrairErrosLogin(validacao.error));
      return;
    }

    setErros({});
    setEntrando(true);

    try {
      const resposta = await fetch("/api/sessao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacao.data),
      });

      const corpo = await resposta.json();

      if (!resposta.ok) {
        setErroGeral(corpo?.mensagem ?? "Nao foi possivel entrar.");
        return;
      }

      // Volta para a pagina que a pessoa tentou abrir antes do login, quando
      // houver; caso contrario, para a area do proprio perfil.
      const continuar = parametros.get("continuar");
      router.replace(continuar || corpo.destino);
      router.refresh();
    } catch {
      setErroGeral(
        "Falha de conexao com o servidor. Verifique sua internet e tente novamente.",
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      <CampoFormulario
        id="email"
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        erro={erros.email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <CampoFormulario
        id="senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        required
        value={senha}
        erro={erros.senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      {erroGeral && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {erroGeral}
        </p>
      )}

      <button
        type="submit"
        disabled={entrando}
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {entrando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function PaginaLogin() {
  return (
    <main className="flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Evently
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Acesse com o e-mail e a senha do seu cadastro.
          </p>
        </header>

        <Suspense fallback={null}>
          <FormularioLogin />
        </Suspense>

        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
          Ainda nao tem conta?{" "}
          <Link
            href="/cadastro/organizador"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Cadastre-se como organizador
          </Link>
        </p>
      </div>
    </main>
  );
}
