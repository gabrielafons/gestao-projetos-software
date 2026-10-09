# Correção do diagnóstico de envio — 2026-10-09

O usuário observou a mensagem genérica de convite criado com falha de e-mail. O registro continuava salvo, mas o destinatário diferia do e-mail permitido pela conta Resend. Uma sondagem técnica sem destinatário humano confirmou `403 validation_error` para o remetente padrão `onboarding@resend.dev`.

A aplicação agora classifica essa restrição, persiste uma explicação fixa e a mostra na criação, listas e recuperação para usuários já autorizados. A solicitação pública de acesso conserva resposta genérica. Erros crus do provedor, endereços da conta e credenciais não são retornados nem persistidos pelo novo classificador. Convite, presença, tentativas e idempotência permanecem independentes do diagnóstico.

O diagnóstico do registro observado foi atualizado após confirmação da causa; nenhum envio ao convidado foi repetido, nem seu endereço alterado. Remetente padrão e configuração privada foram preservados. Para destinatários fora da própria conta, a restrição exige domínio verificado; repetir envio não resolve essa configuração.

Verificação: RED antes do helper; três testes de classificação/sanitização aprovados; suíte unitária 62/62; typecheck, lint dos arquivos alterados e build aprovados. Revisão independente do diff aprovada sem achados acionáveis. Servidor local de produção recompilado e reiniciado na porta 3100; dados preservados. Integração/E2E anteriores não foram repetidos neste ajuste, para preservar os dados em uso.

Limitação da versão instalada Resend 6.32.1: o SDK registra a resposta crua em desenvolvimento e não oferece opção pública para desativar esse log. O servidor disponível roda em produção, onde esse log não ocorre. Não foram aplicados monkeypatch nem alteração global de console.

Referência: [restrição do remetente padrão](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
