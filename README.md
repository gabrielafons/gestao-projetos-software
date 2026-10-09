# Evently — Gestão de Eventos Corporativos

Integrantes: Gabriel Afonso dos Santos (Dev), Giovane Contreras Oba (PO), Gustavo Trovó Ramos de Souza (SM) e Igor de Araujo Borges (Dev).

Plataforma de eventos por convite, sem venda de ingressos. A Sprint 1 implementa cadastro de organizador, login/logout, eventos, convites nominais, acesso verificado por e-mail, cadastro de participante, confirmação/recusa e notificações recuperáveis. Material preparatório, guia, portaria, quiz, brindes e transferência pertencem às próximas sprints.

O escopo dos 33 cards está em [plano-sprint-1.md](docs/plano-sprint-1.md). A evidência de implementação e os limites da homologação estão em [entrega-sprint-1.md](docs/entrega-sprint-1.md).

## Rodar em ambiente isolado

Pré-requisitos: Node 22+, Docker e Supabase CLI 2.78.1. O projeto local é `evently-sprint1`; API 55431, Postgres 55432, Mailpit 55434, aplicação 3100. Os testes de integração/E2E rejeitam URLs Supabase fora desse ambiente.

```bash
npm ci
supabase start -x realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
node scripts/configurar-local.mjs
npm run dev -- -p 3100
```

O configurador cria `.env.local` com as chaves locais e um segredo de worker, sem imprimi-los. Se o arquivo já existe, preserva a configuração e interrompe. Abra [Evently local](http://localhost:3100) e [caixa de e-mails de teste](http://127.0.0.1:55434). Use apenas destinatários sintéticos no ambiente local.

Para aplicar migrations novas, use `supabase migration up --local`. Para reproduzir o schema do zero, `supabase db reset --local --no-seed` **apaga os dados do projeto local**; execute somente no ambiente de testes dedicado, com as suítes paradas. As migrations antigas permanecem preservadas; as novas são aditivas/corretivas.

## Homologação externa

Copie `.env.example` para `.env.local` ou configure as variáveis no servidor:

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Projeto correto e chave pública, submetida a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas servidor; nunca no navegador/Git |
| `APP_URL` | Origem HTTPS absoluta da aplicação, sem caminho |
| `EMAIL_TRANSPORT=resend` | Entrega externa |
| `RESEND_API_KEY` / `EMAIL_FROM` | Credencial e remetente (padrão de testes: onboarding@resend.dev) |
| `NOTIFICATION_WORKER_TOKEN` | Segredo aleatório de pelo menos 32 caracteres |

Antes de aplicar no remoto, confirme identidade do projeto e histórico de migrations. Aplique apenas migrations pendentes; não repare nem reescreva histórico desconhecido. Configure Site URL e URLs permitidas do Auth para o endereço real da aplicação. Nunca use `ALLOW_LOCAL_EMAIL` em homologação externa/produção.

Com `onboarding@resend.dev`, o Resend entrega apenas ao e-mail da própria conta e aos simuladores oficiais; outros convidados exigem domínio verificado. O destinatário controlado deve comprovar recebimento real de convite, acesso e confirmação. Estado `enviado` significa aceitação pelo transporte/provedor; não comprova chegada à caixa externa. A entrega local usa Mailpit e não consome Resend.

## Roteiro da Sprint 1

1. Crie organizador em `/cadastro/organizador`; entre no painel.
2. Crie um evento futuro com nome, data, horário e local. Datas usam `America/Sao_Paulo`.
3. Emita convite com nome, e-mail, CPF e telefone. A pessoa é única por evento/e-mail.
4. Na caixa de teste, abra o convite. O GET mostra apenas evento/e-mail mascarado e não cria identidade, perfil ou presença.
5. Solicite o acesso postal e abra o segundo e-mail. Clique explicitamente para verificar seu e-mail.
6. Revise os dados, conclua cadastro e abra `/meus-convites`.
7. Confirme ou recuse. O status persiste; confirmação gera uma notificação única e aparece também ao organizador.
8. Confira logout, validade e falhas recuperáveis de e-mail. O organizador pode recuperar convite/confirmacão; o participante com prova postal pode recuperar sua confirmação.

Senha abre a área do organizador. A área do convidado exige prova postal por sessão e convite; ser organizador com e-mail declarado/auto-confirmado não constitui essa prova. Uma nova sessão por senha não herda dados do participante. Ao verificar um segundo convite no mesmo navegador/usuário, provas anteriores daquela sessão são preservadas, incluindo histórico expirado. Não há cópia global de provas por usuário.

## E-mail e recuperação

Convite e notificação são inseridos na mesma transação. Confirmação e notificação seguem a mesma regra. Falha de transporte não desfaz convite ou presença. A fila `notificacoes` contém estado separado (`pendente`, `processando`, `enviado`, `falhou`), tentativa, lease de cinco minutos, chave de idempotência e ID do provedor. Os templates têm HTML/texto e não incluem CPF/telefone.

O request tenta o envio imediatamente. Pendências também precisam de um **agendador externo** no ambiente de deploy: chamar o processador a cada minuto e monitorar falhas. O script abaixo executa uma rodada; não instala nem agenda um cron por si só:

```bash
npm run email:worker
```

Ele chama `POST /api/notificacoes/processar` com `Authorization: Bearer <segredo>`, sem imprimir o segredo. O servidor precisa permitir até 120 segundos (cinco mensagens por rodada; cada chamada de transporte tem timeout de 15 segundos). Um scheduler pode chamar o endpoint diretamente com o mesmo header secreto. Rotas de recuperação respeitam ownership/prova postal e reutilizam a notificação e sua chave, inclusive após dez tentativas. Mensagens já enviadas não são reenviadas por esse mecanismo. O botão só aparece em estados recuperáveis.

Resend usa chave estável de idempotência; a garantia do provedor tem uma janela limitada. Não há promessa de exatamente uma entrega externa em falhas indeterminadas além dessa janela. Não apagar o outbox para repetir envios; preserve o ID do provedor para investigação.

## Checks reproduzíveis

```bash
npm test
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

Rode integração e E2E **em sequência**, pois usam fixtures de CPF e o mesmo banco dedicado. E2E usa Auth/Postgres/Mailpit reais, abre links extraídos do e-mail capturado e interrompe/reinicia apenas `supabase_inbucket_evently-sprint1` para provar falha/recuperação. Não execute junto de uma demonstração. Os usuários criados pelas suítes são removidos depois; relatórios e traces ficam ignorados em `playwright-report/` e `test-results/` e podem conter tokens sintéticos.

## Arquitetura e acesso

Next.js 16.4.0, React 19.2.8, TypeScript, Zod, Supabase Auth/Postgres/RLS, Resend e React Email. `src/proxy.ts` renova sessão e preserva cookies nos redirects; guards de serviço, RPCs restritas e RLS autorizam cada operação. Links internos de retorno são sanitizados. Permissões de organizador/convidado vêm dos vínculos no banco, nunca de `user_metadata` editável. Operador usa metadado administrado pelo servidor e tem apenas destino protegido nesta sprint.

- `src/app`: páginas e endpoints HTTP.
- `src/components`: formulários, estado, navegação e detalhes.
- `src/lib/services`: autorização e regras de negócio.
- `src/lib/validators`: contratos compartilhados UI/API.
- `src/lib/email` / `src/emails`: transporte e templates.
- `supabase/migrations`: schema, integridade, RLS e transações restritas.
- `tests/integration` / `tests/e2e`: verificação integrada isolada.

Funções transacionais existem apenas para fronteiras de integridade (convite/outbox, perfil/vínculo, resposta/outbox, claim e prova postal). APIs RPC privilegiadas são exclusivas de `service_role`; tabelas de notificações/provas/limites não ficam acessíveis ao browser. Tokens de convite são aleatórios de 32 bytes, armazenados como hash; código de participante não é credencial de acesso. Convite encaminhado não substitui prova de caixa postal. Dados pessoais não entram no e-mail/página pública nem no log de erros.

Mutations verificam a origem e usam limite persistente por IP/convite. Em deploy, o proxy de entrada deve definir/remover `X-Forwarded-For` de forma confiável; não exponha a porta Node diretamente permitindo IP arbitrário fornecido pelo cliente.

## Rollback

Reverta commits de aplicação e desative o worker/novos fluxos. Preserve schema, participantes, respostas, histórico de provas e notificações; use migration corretiva para problemas no banco. Reverter código não reverte e-mails enviados. Nunca excluir perfis/convites para desfazer deploy. O release exige migrations e variáveis disponíveis antes de habilitar rotas.

O ambiente desta entrega usa `.env.local` com Resend e remetente padrão, conforme solicitado. A cópia `.env.test.local` preserva o transporte Mailpit para testes isolados. Ao repetir E2E, pare o servidor Resend, use a configuração local de testes e suba o servidor com `EMAIL_TRANSPORT=local` (ambos usam o mesmo banco dedicado). O arquivo de teste também é privado e ignorado pelo Git.

O smoke remoto é explícito: `node --env-file=.env.local tests/manual/resend.mjs`. Envia três mensagens somente para `delivered+...@resend.dev`, exercita a API da aplicação e apaga seus usuários locais ao concluir. Não faz parte de `npm test`.
