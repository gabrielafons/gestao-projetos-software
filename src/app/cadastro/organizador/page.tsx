"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CampoFormulario } from "@/components/campo-formulario";
import { RequisitosSenha } from "@/components/requisitos-senha";
import { formatarCpf } from "@/lib/validators/cpf";
import { TAMANHO_MAXIMO_NOME } from "@/lib/validators/nome";
import { TAMANHO_MAXIMO_SENHA } from "@/lib/validators/senha";
import { formatarTelefone } from "@/lib/validators/telefone";
import {
  extrairErrosPorCampo,
  schemaCadastroOrganizador,
  TAMANHO_MAXIMO_EMAIL,
  validarCampo,
  type ErrosPorCampo,
} from "@/lib/validators/organizador";

/**
 * UH 01 - T4 - Formulario de cadastro de organizador com validacao na UI.
 *
 * Usa o mesmo schema do endpoint. A validacao daqui e conveniencia: o
 * servidor valida de novo, sempre.
 */

const VALORES_INICIAIS = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  senha: "",
};

type Campos = typeof VALORES_INICIAIS;
type NomeCampo = keyof Campos;

export default function PaginaCadastroOrganizador() {
  const router = useRouter();
  const [campos, setCampos] = useState<Campos>(VALORES_INICIAIS);
  const [erros, setErros] = useState<ErrosPorCampo>({});
  const [tocados, setTocados] = useState<Partial<Record<NomeCampo, boolean>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  /** Um campo so e dado por valido depois que a pessoa passou por ele. */
  function ehValido(campo: NomeCampo) {
    return (
      Boolean(campos[campo]) &&
      !erros[campo] &&
      validarCampo(campo, campos[campo]) === undefined
    );
  }

  function atualizar(campo: NomeCampo, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));

    // Erro some assim que a pessoa corrige; so reaparece ao sair do campo.
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function aoSairDoCampo(campo: NomeCampo) {
    setTocados((atual) => ({ ...atual, [campo]: true }));

    // A senha tem a propria lista de requisitos logo abaixo: repetir a
    // pendencia como mensagem de erro seria dizer a mesma coisa duas vezes.
    if (campo === "senha") return;

    const valor = campos[campo];
    if (!valor) return;

    setErros((atual) => ({ ...atual, [campo]: validarCampo(campo, valor) }));
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    // Cenario 2: barra o envio e aponta os campos a corrigir.
    const validacao = schemaCadastroOrganizador.safeParse(campos);

    if (!validacao.success) {
      setErros(extrairErrosPorCampo(validacao.error));
      setTocados({
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        senha: true,
      });
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
      // UH 01 - T5: a sessao e aberta na sequencia, para a pessoa nao ter de
      // digitar de novo o que acabou de cadastrar.
      const sessao = await fetch("/api/sessao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: validacao.data.email,
          senha: validacao.data.senha,
        }),
      });

      if (sessao.ok) {
        const { destino } = await sessao.json();
        router.replace(destino);
        router.refresh();
        return;
      }

      // A conta existe; so a sessao automatica falhou. Sobra entrar a mao.
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
            Sua conta de organizador foi criada. Entre para cadastrar seu
            primeiro evento.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Entrar
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
            maxLength={TAMANHO_MAXIMO_NOME}
            placeholder="Nome e sobrenome"
            value={campos.nome}
            erro={tocados.nome ? erros.nome : undefined}
            valido={ehValido("nome")}
            onChange={(e) => atualizar("nome", e.target.value)}
            onBlur={() => aoSairDoCampo("nome")}
          />

          <CampoFormulario
            id="email"
            rotulo="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={TAMANHO_MAXIMO_EMAIL}
            value={campos.email}
            erro={tocados.email ? erros.email : undefined}
            valido={ehValido("email")}
            onChange={(e) => atualizar("email", e.target.value)}
            onBlur={() => aoSairDoCampo("email")}
          />

          <CampoFormulario
            id="cpf"
            rotulo="CPF"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            required
            value={formatarCpf(campos.cpf)}
            erro={tocados.cpf ? erros.cpf : undefined}
            valido={ehValido("cpf")}
            onChange={(e) => atualizar("cpf", e.target.value)}
            onBlur={() => aoSairDoCampo("cpf")}
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
            erro={tocados.telefone ? erros.telefone : undefined}
            valido={ehValido("telefone")}
            onChange={(e) => atualizar("telefone", e.target.value)}
            onBlur={() => aoSairDoCampo("telefone")}
          />

          <div>
            <CampoFormulario
              id="senha"
              rotulo="Senha"
              type="password"
              autoComplete="new-password"
              required
              maxLength={TAMANHO_MAXIMO_SENHA}
              aria-describedby="senha-requisitos"
              value={campos.senha}
              erro={tocados.senha ? erros.senha : undefined}
              valido={ehValido("senha")}
              onChange={(e) => atualizar("senha", e.target.value)}
              onBlur={() => aoSairDoCampo("senha")}
            />
            <RequisitosSenha id="senha-requisitos" senha={campos.senha} />
          </div>

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
