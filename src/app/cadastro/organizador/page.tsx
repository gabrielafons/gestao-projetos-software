"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { CampoFormulario } from "@/components/campo-formulario";
import { formatarCpf } from "@/lib/validators/cpf";
import { formatarTelefone } from "@/lib/validators/telefone";
import {
  extrairErrosPorCampo,
  schemaCadastroOrganizador,
  type ErrosPorCampo,
} from "@/lib/validators/organizador";

/**
 * UH 01 - T4 - Formulario de cadastro de organizador com validacao na UI.
 *
 * A validacao daqui usa o MESMO schema do endpoint (`schemaCadastroOrganizador`),
 * entao a mensagem na tela e a regra do servidor nunca divergem. Isso e
 * conveniencia para o usuario: o servidor valida de novo, sempre.
 */

const VALORES_INICIAIS = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  senha: "",
};

type Campos = typeof VALORES_INICIAIS;

export default function PaginaCadastroOrganizador() {
  const [campos, setCampos] = useState<Campos>(VALORES_INICIAIS);
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  function atualizar(campo: keyof Campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    // Limpa o erro assim que a pessoa comeca a corrigir o campo.
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    // Cenario 2: barra o envio e aponta os campos a corrigir.
    const validacao = schemaCadastroOrganizador.safeParse(campos);

    if (!validacao.success) {
      setErros(extrairErrosPorCampo(validacao.error));
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/organizadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacao.data),
      });

      const corpo = await resposta.json();

      if (!resposta.ok) {
        // O servidor tambem devolve erros por campo quando a validacao falha la.
        if (corpo?.erros) setErros(corpo.erros as ErrosPorCampo);
        setErroGeral(corpo?.mensagem ?? "Nao foi possivel concluir o cadastro.");
        return;
      }

      // Cenario 1: conta criada, acesso liberado.
      setConcluido(true);
    } catch {
      setErroGeral(
        "Falha de conexao com o servidor. Verifique sua internet e tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (concluido) {
    return (
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            <span aria-hidden="true" className="text-xl">
              ✓
            </span>
          </div>
          <h1 className="text-xl font-semibold">Cadastro realizado</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Sua conta de organizador foi criada. Voce ja pode acessar a
            plataforma e cadastrar seu primeiro evento.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Voltar ao inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Evently
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Criar conta de organizador
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Cadastre-se para criar eventos e emitir convites nominais.
          </p>
        </header>

        <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
          <CampoFormulario
            id="nome"
            rotulo="Nome completo"
            autoComplete="name"
            required
            value={campos.nome}
            erro={erros.nome}
            onChange={(e) => atualizar("nome", e.target.value)}
          />

          <CampoFormulario
            id="email"
            rotulo="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={campos.email}
            erro={erros.email}
            onChange={(e) => atualizar("email", e.target.value)}
          />

          <CampoFormulario
            id="cpf"
            rotulo="CPF"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            required
            value={formatarCpf(campos.cpf)}
            erro={erros.cpf}
            onChange={(e) => atualizar("cpf", e.target.value)}
          />

          <CampoFormulario
            id="telefone"
            rotulo="Telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            required
            value={formatarTelefone(campos.telefone)}
            erro={erros.telefone}
            onChange={(e) => atualizar("telefone", e.target.value)}
          />

          <CampoFormulario
            id="senha"
            rotulo="Senha"
            type="password"
            autoComplete="new-password"
            required
            value={campos.senha}
            erro={erros.senha}
            ajuda="Ao menos 8 caracteres, combinando letras e numeros."
            onChange={(e) => atualizar("senha", e.target.value)}
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
            disabled={enviando}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>
      </div>
    </main>
  );
}
