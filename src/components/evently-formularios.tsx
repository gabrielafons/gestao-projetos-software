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

type CamposPessoa = {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
};
function CamposPessoaFormulario({
  campos,
  mudar,
  erros,
  prefixo,
  emailBloqueado = false,
}: {
  campos: CamposPessoa;
  mudar: (campo: keyof CamposPessoa, valor: string) => void;
  erros: Record<string, string>;
  prefixo: string;
  emailBloqueado?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoFormulario
        id={`${prefixo}-nome`}
        rotulo="Nome completo"
        autoComplete="name"
        required
        maxLength={TAMANHO_MAXIMO_NOME}
        value={campos.nome}
        erro={erros.nome ?? erros.nome_convidado}
        onChange={(e) => mudar("nome", e.target.value)}
      />
      <CampoFormulario
        id={`${prefixo}-email`}
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        required
        maxLength={TAMANHO_MAXIMO_EMAIL}
        readOnly={emailBloqueado}
        ajuda={
          emailBloqueado
            ? "Este é o e-mail verificado para o seu convite."
            : "O convite será enviado para este endereço."
        }
        value={campos.email}
        erro={erros.email}
        onChange={(e) => mudar("email", e.target.value)}
      />
      <CampoFormulario
        id={`${prefixo}-cpf`}
        rotulo="CPF"
        inputMode="numeric"
        autoComplete="off"
        required
        maxLength={14}
        placeholder="000.000.000-00"
        value={formatarCpf(campos.cpf)}
        erro={erros.cpf}
        onChange={(e) => mudar("cpf", e.target.value)}
      />
      <CampoFormulario
        id={`${prefixo}-telefone`}
        rotulo="Telefone"
        type="tel"
        autoComplete="tel"
        required
        maxLength={16}
        placeholder="(00) 00000-0000"
        value={formatarTelefone(campos.telefone)}
        erro={erros.telefone}
        onChange={(e) => mudar("telefone", e.target.value)}
      />
    </div>
  );
}

export function FormularioConvite({ eventoId }: { eventoId: number }) {
  const router = useRouter();
  const envio = useEnvio();
  const [campos, setCampos] = useState<CamposPessoa>({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
  });
  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { nome, ...demais } = campos;
    const validacao = schemaEmissaoConvite.safeParse({
      ...demais,
      nome_convidado: nome,
      evento_id: eventoId,
    });
    if (!validacao.success) {
      // A chave do contrato é nome_convidado; o campo visual usa nome.
      envio.validar(validacao.error, "convite");
      if (validacao.error.issues.some((i) => i.path[0] === "nome_convidado"))
        document.getElementById("convite-nome")?.focus();
      return;
    }
    const corpo = await envio.enviar("/api/convites", validacao.data);
    if (!corpo) return;
    setCampos({ nome: "", email: "", cpf: "", telefone: "" });
    envio.setSucesso(
      corpo.envio_status === "falhou"
        ? "Convite criado. O e-mail não foi enviado; use Tentar envio novamente na lista abaixo."
        : corpo.envio_status === "enviado"
          ? "Convite criado e e-mail enviado."
          : "Convite criado. O envio do e-mail está em andamento.",
    );
    router.refresh();
  }
  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="space-y-5"
      aria-busy={envio.enviando}
    >
      <fieldset disabled={envio.enviando}>
        <legend className="sr-only">Dados do convidado</legend>
        <CamposPessoaFormulario
          prefixo="convite"
          campos={campos}
          erros={envio.erros}
          mudar={(campo, valor) => {
            setCampos((atual) => ({ ...atual, [campo]: valor }));
            envio.setErros((atual) => ({
              ...atual,
              [campo]: "",
              ...(campo === "nome" ? { nome_convidado: "" } : {}),
            }));
          }}
        />
      </fieldset>
      {envio.avisos}
      <button type="submit" disabled={envio.enviando} className={classeBotao}>
        {envio.enviando ? "Emitindo convite…" : "Emitir e enviar convite"}
      </button>
    </form>
  );
}

export function FormularioCadastroConvidado({
  token,
  iniciais,
}: {
  token: string;
  iniciais: CamposPessoa;
}) {
  const router = useRouter();
  const envio = useEnvio();
  const [concluido, setConcluido] = useState(false);
  const [campos, setCampos] = useState(iniciais);
  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validacao = schemaCadastroConvidado.safeParse({ ...campos, token });
    if (!validacao.success) return envio.validar(validacao.error, "cadastro");
    const corpo = await envio.enviar("/api/convidados", validacao.data);
    if (corpo) {
      setConcluido(true);
      envio.setSucesso("Cadastro concluído. Abrindo seus convites…");
      router.replace("/meus-convites");
      router.refresh();
    }
  }
  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="max-w-2xl space-y-5"
      aria-busy={envio.enviando}
    >
      <fieldset disabled={envio.enviando || concluido}>
        <legend className="sr-only">Seus dados pessoais</legend>
        <CamposPessoaFormulario
          prefixo="cadastro"
          campos={campos}
          erros={envio.erros}
          emailBloqueado
          mudar={(campo, valor) => {
            if (campo === "email") return;
            setCampos((atual) => ({ ...atual, [campo]: valor }));
            envio.setErros((atual) => ({ ...atual, [campo]: "" }));
          }}
        />
      </fieldset>
      {envio.avisos}
      <button
        type="submit"
        className={classeBotao}
        disabled={envio.enviando || concluido}
      >
        {concluido
          ? "Cadastro concluído"
          : envio.enviando
            ? "Salvando seus dados…"
            : "Concluir cadastro e ver convites"}
      </button>
    </form>
  );
}

export function BotaoSolicitarAcesso({ token }: { token: string }) {
  const envio = useEnvio();
  const [solicitado, setSolicitado] = useState(false);
  async function solicitar() {
    const corpo = await envio.enviar("/api/convites/acesso", { token });
    if (corpo) {
      setSolicitado(true);
      envio.setSucesso(
        corpo.mensagem ??
          "Solicitação recebida. Confira o e-mail do convite e a pasta de spam para continuar.",
      );
    }
  }
  return (
    <div className="space-y-4">
      {envio.avisos}
      <button
        type="button"
        disabled={envio.enviando || solicitado}
        onClick={solicitar}
        className={classeBotao}
      >
        {envio.enviando
          ? "Solicitando acesso…"
          : solicitado
            ? "Solicitação recebida"
            : "Receber link de acesso por e-mail"}
      </button>
    </div>
  );
}

export function ConfirmarAcesso({
  tokenHash,
  convite,
}: {
  tokenHash: string | null;
  convite: string | null;
}) {
  const envio = useEnvio();
  const router = useRouter();
  const valido = Boolean(
    tokenHash && convite && /^[a-f0-9]{64}$/i.test(convite),
  );
  async function confirmar() {
    const corpo = await envio.enviar("/api/sessao/convite", {
      token_hash: tokenHash,
      convite,
    });
    if (corpo?.destino) {
      router.replace(
        `/cadastro/convidado?convite=${encodeURIComponent(convite!)}`,
      );
      router.refresh();
    }
  }
  if (!valido)
    return (
      <Aviso erro>
        O link de acesso está incompleto. Volte ao convite e solicite um novo
        link por e-mail.
      </Aviso>
    );
  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Clique abaixo para verificar seu e-mail e continuar o cadastro do
        convite.
      </p>
      {envio.avisos}
      <button
        type="button"
        disabled={envio.enviando}
        onClick={confirmar}
        className={classeBotao}
      >
        {envio.enviando
          ? "Verificando acesso…"
          : "Verificar meu e-mail e continuar"}
      </button>
    </div>
  );
}
