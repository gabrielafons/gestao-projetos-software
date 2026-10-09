async function main() {
  const origem = process.env.APP_URL;
  const token = process.env.NOTIFICATION_WORKER_TOKEN;
  if (!origem || !token || token.length < 32)
    throw new Error("Configure APP_URL e NOTIFICATION_WORKER_TOKEN.");
  const response = await fetch(`${origem}/api/notificacoes/processar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) {
    console.error("Processador indisponível:", response.status);
    process.exitCode = 1;
  } else {
    const dados = await response.json();
    console.log(
      JSON.stringify({
        processadas: dados.resultados.length,
        falhas: dados.resultados.filter(
          (r: { estado: string }) => r.estado === "falhou",
        ).length,
      }),
    );
  }
}
main().catch(() => {
  console.error("Falha ao processar notificações.");
  process.exitCode = 1;
});
