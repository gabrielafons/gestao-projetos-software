"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ZodError } from "zod";
import { CampoFormulario } from "@/components/campo-formulario";
import { Aviso, classeBotao } from "@/components/evently-ui";
import { formatarCpf } from "@/lib/validators/cpf";
import { formatarTelefone } from "@/lib/validators/telefone";
import { TAMANHO_MAXIMO_NOME } from "@/lib/validators/nome";
import { TAMANHO_MAXIMO_EMAIL } from "@/lib/validators/organizador";
import { schemaEvento } from "@/lib/validators/evento";
import { schemaEmissaoConvite } from "@/lib/validators/convite";
import { schemaCadastroConvidado } from "@/lib/validators/convidado";
import { schemaRespostaConvite } from "@/lib/validators/resposta-convite";

type CorpoResposta = {
  mensagem?: string;
  erros?: Record<string, string>;
  evento?: { id: number };
  destino?: string;
  envio_status?: string;
  confirmacao_envio_status?: string | null;
};

function errosCampos(erro: ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = String(issue.path[0] ?? "");
    if (campo && !campos[campo]) campos[campo] = issue.message;
  }
  return campos;
}

function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function enviar(
    url: string,
    dados: unknown,
    method = "POST",
  ): Promise<CorpoResposta | null> {
    setErro(null);
    setSucesso(null);
    setErros({});
    setEnviando(true);
    try {
      const resposta = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const corpo: CorpoResposta = await resposta.json();
      if (!resposta.ok) {
        setErro(
          corpo.mensagem ?? "Não foi possível concluir. Tente novamente.",
        );
        if (corpo.erros) setErros(corpo.erros);
        return null;
      }
      return corpo;
    } catch {
      setErro(
        "Não foi possível confirmar o resultado. Verifique sua conexão e atualize a página antes de tentar novamente.",
      );
      return null;
    } finally {
      setEnviando(false);
    }
  }

  function validar(erroValidacao: ZodError, prefixo: string) {
    const campos = errosCampos(erroValidacao);
    setErros(campos);
    setErro("Revise os campos indicados para continuar.");
    setSucesso(null);
    document.getElementById(`${prefixo}-${Object.keys(campos)[0]}`)?.focus();
  }

  const avisos = (
    <div className="space-y-3" aria-live="polite">
      {erro && <Aviso erro>{erro}</Aviso>}
      {sucesso && <Aviso>{sucesso}</Aviso>}
    </div>
  );
  return {
    enviar,
    validar,
    enviando,
    erros,
    setErros,
    setErro,
    setSucesso,
    avisos,
  };
}

export function FormularioEvento() {
  const router = useRouter();
  const envio = useEnvio();
  const [concluido, setConcluido] = useState(false);
  const [campos, setCampos] = useState({
    nome: "",
    data: "",
    horario: "",
    local: "",
  });
  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validacao = schemaEvento.safeParse(campos);
    if (!validacao.success) return envio.validar(validacao.error, "evento");
    const corpo = await envio.enviar("/api/eventos", validacao.data);
    if (corpo?.evento) {
      setConcluido(true);
      envio.setSucesso("Evento criado. Abrindo os detalhes…");
      router.push(`/painel/eventos/${corpo.evento.id}`);
      router.refresh();
    }
  }
  function mudar(campo: keyof typeof campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    envio.setErros((atual) => ({ ...atual, [campo]: "" }));
  }
  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="max-w-2xl space-y-5"
      aria-busy={envio.enviando}
    >
      <fieldset disabled={envio.enviando || concluido} className="space-y-5">
        <legend className="sr-only">Dados do novo evento</legend>
        <CampoFormulario
          id="evento-nome"
          rotulo="Nome do evento"
          required
          maxLength={150}
          value={campos.nome}
          erro={envio.erros.nome}
          onChange={(e) => mudar("nome", e.target.value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoFormulario
            id="evento-data"
            rotulo="Data"
            type="date"
            required
            value={campos.data}
            erro={envio.erros.data}
            onChange={(e) => mudar("data", e.target.value)}
          />
          <CampoFormulario
            id="evento-horario"
            rotulo="Horário"
            type="time"
            required
            value={campos.horario}
            erro={envio.erros.horario}
            onChange={(e) => mudar("horario", e.target.value)}
          />
        </div>
        <CampoFormulario
          id="evento-local"
          rotulo="Local do evento"
          required
          maxLength={300}
          ajuda="Informe o nome do local e o endereço para orientar os convidados."
          value={campos.local}
          erro={envio.erros.local}
          onChange={(e) => mudar("local", e.target.value)}
        />
      </fieldset>
      {envio.avisos}
      <button
        type="submit"
        disabled={envio.enviando || concluido}
        className={classeBotao}
      >
        {concluido
          ? "Evento criado"
          : envio.enviando
            ? "Criando evento…"
            : "Criar evento"}
      </button>
    </form>
  );
}