# Entrega da Sprint 1 — Evently

Evidência registrada em 2026-10-09, 23:30 UTC, na branch `feat/sprint-1-completa`, partindo de `origin/main` (`3f4bd53`). Trello permanece sem alterações. Implementação correspondente aos 33 cards da lista Concluído, nas seis histórias UH01/UH02/UH03/UH04/UH05/UH06. As descrições e decisões aprovadas estão em [plano-sprint-1.md](plano-sprint-1.md).

**Resultado:** 33/33 tarefas com implementação e evidência local; jornadas completas aprovadas com Supabase Auth/Postgres/RLS reais e caixa Mailpit. Integração Resend real aprovada com o remetente padrão no simulador oficial. **Homologação em Supabase hospedado/deploy e recebimento na caixa humana não foram realizados.** O projeto remoto antigo estava indisponível e o destino atual não foi fornecido. A chave fornecida pelo usuário fica exclusivamente em `.env.local`, ignorado pelo Git.

## Checks finais

| Check | Evidência |
|---|---|
| Migrations do zero | `supabase db reset --local --no-seed`: sete migrations aplicadas sem erro em `evently-sprint1` |
| Unitários | `npm test`: 59/59 (inclui campos, retorno seguro, vigência, resposta e compensação) |
| Banco/Auth/RLS | `npm run test:integration`: 15/15 com credenciais de usuários comuns e chamadas privilegiadas isoladas |
| Navegador | `npm run test:e2e`: 8/8 Chromium sobre `next start`, incluindo viewport mobile 390×844 |
| Tipos/lint | `npm run typecheck` e `npm run lint`: exit 0 |
| Produção | `npm run build`: exit 0, 20 páginas geradas e APIs/páginas dinâmicas disponíveis |
| Worker | `npm run email:worker`: processador autenticado executado, sem pendências/falhas no momento do check |
| Dependências runtime | `npm audit --omit=dev`: zero vulnerabilidades; Next atualizado de 16.3.4 para 16.4.0 |
| Revisão independente | Brecha postal, recuperação da confirmação e falso reenvio corrigidos; continuidade de dois convites revalidada por inspeção e E2E |

O audit completo mantém cinco registros de severidade alta da mesma cadeia de ferramenta de lint (`braces`/`micromatch`/`fast-glob`/ESLint Next), sem correção compatível disponível; a sugestão automática era downgrade do Next ESLint. Não aplicado downgrade forçado. Nenhum está na árvore de dependências runtime. Referência: [advisory braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

## Rastreabilidade por card

Os arquivos citados ficam em `src/lib/services`, `src/lib/validators`, `src/app`, `src/emails` e `supabase/migrations`; testes em `src/**/__tests__`, `tests/integration/sprint.test.ts` e `tests/e2e/sprint.spec.ts`.

| Card | Implementação/evolução | Verificação concluída |
|---|---|---|
| UH 01 T1 — perfil organizador — [8q89yaUn](https://trello.com/c/8q89yaUn) | `organizadores.ts`, schema/página organizador, API e migration UH01 | Unitários de campos/compensação; E2E cadastro válido, CPF/e-mail duplicado e falha no login automático |
| UH 01 T2 — endpoint cadastro — [X3h5RG3P](https://trello.com/c/X3h5RG3P) | `organizadores.ts`, schema/página organizador, API e migration UH01 | Unitários de campos/compensação; E2E cadastro válido, CPF/e-mail duplicado e falha no login automático |
| UH 01 T3 — validar organizador — [O8fgTcCa](https://trello.com/c/O8fgTcCa) | `organizadores.ts`, schema/página organizador, API e migration UH01 | Unitários de campos/compensação; E2E cadastro válido, CPF/e-mail duplicado e falha no login automático |
| UH 01 T4 — formulário — [9jPtVx1u](https://trello.com/c/9jPtVx1u) | `organizadores.ts`, schema/página organizador, API e migration UH01 | Unitários de campos/compensação; E2E cadastro válido, CPF/e-mail duplicado e falha no login automático |
| UH 01 T5 — integrar Auth/perfil — [gTOvyPWo](https://trello.com/c/gTOvyPWo) | `organizadores.ts`, schema/página organizador, API e migration UH01 | Unitários de campos/compensação; E2E cadastro válido, CPF/e-mail duplicado e falha no login automático |
| UH 04 T1 — SDK client/server — [fW34fDjs](https://trello.com/c/fW34fDjs) | `autenticacao.ts`, `perfis.ts`, `proxy.ts`, login e API sessão | Unitários de perfil/retorno; integração metadados adulterados; E2E senha inválida, logout, isolamento e OTP |
| UH 04 T2 — autenticar — [UnhcoNfO](https://trello.com/c/UnhcoNfO) | `autenticacao.ts`, `perfis.ts`, `proxy.ts`, login e API sessão | Unitários de perfil/retorno; integração metadados adulterados; E2E senha inválida, logout, isolamento e OTP |
| UH 04 T3 — perfis/permissões — [IkcPTDPW](https://trello.com/c/IkcPTDPW) | `autenticacao.ts`, `perfis.ts`, `proxy.ts`, login e API sessão | Unitários de perfil/retorno; integração metadados adulterados; E2E senha inválida, logout, isolamento e OTP |
| UH 04 T4 — tela login — [SuTJm9fO](https://trello.com/c/SuTJm9fO) | `autenticacao.ts`, `perfis.ts`, `proxy.ts`, login e API sessão | Unitários de perfil/retorno; integração metadados adulterados; E2E senha inválida, logout, isolamento e OTP |
| UH 04 T5 — tela/SDK — [4ifiO66R](https://trello.com/c/4ifiO66R) | `autenticacao.ts`, `perfis.ts`, `proxy.ts`, login e API sessão | Unitários de perfil/retorno; integração metadados adulterados; E2E senha inválida, logout, isolamento e OTP |
| UH 03 T1 — tabela eventos — [1JbEgA0g](https://trello.com/c/1JbEgA0g) | Schema/serviço/API eventos, painel e páginas de cadastro/detalhe | Unitário de data/horário; integração ownership; E2E criação persistida e dados inválidos/evento alheio |
| UH 03 T2 — endpoint evento — [bvQ9a0f9](https://trello.com/c/bvQ9a0f9) | Schema/serviço/API eventos, painel e páginas de cadastro/detalhe | Unitário de data/horário; integração ownership; E2E criação persistida e dados inválidos/evento alheio |
| UH 03 T3 — validar evento — [ufIN1xsw](https://trello.com/c/ufIN1xsw) | Schema/serviço/API eventos, painel e páginas de cadastro/detalhe | Unitário de data/horário; integração ownership; E2E criação persistida e dados inválidos/evento alheio |
| UH 03 T4 — formulário evento — [KTblXqsZ](https://trello.com/c/KTblXqsZ) | Schema/serviço/API eventos, painel e páginas de cadastro/detalhe | Unitário de data/horário; integração ownership; E2E criação persistida e dados inválidos/evento alheio |
| UH 03 T5 — integrar cadastro — [EperiLZN](https://trello.com/c/EperiLZN) | Schema/serviço/API eventos, painel e páginas de cadastro/detalhe | Unitário de data/horário; integração ownership; E2E criação persistida e dados inválidos/evento alheio |
| UH 05 T1 — convite/evento — [YxqzOsni](https://trello.com/c/YxqzOsni) | Serviço/schema/API convites, migration transacional, UI de emissão, templates/Resend/outbox | Integração unicidade/atomicidade; E2E nominal, entrega capturada e recuperação; smoke Resend real |
| UH 05 T2 — emitir convite — [eEuOgkla](https://trello.com/c/eEuOgkla) | Serviço/schema/API convites, migration transacional, UI de emissão, templates/Resend/outbox | Integração unicidade/atomicidade; E2E nominal, entrega capturada e recuperação; smoke Resend real |
| UH 05 T3 — validar convidado — [rTVCutiB](https://trello.com/c/rTVCutiB) | Serviço/schema/API convites, migration transacional, UI de emissão, templates/Resend/outbox | Integração unicidade/atomicidade; E2E nominal, entrega capturada e recuperação; smoke Resend real |
| UH 05 T4 — tela emissão — [CHN5TawV](https://trello.com/c/CHN5TawV) | Serviço/schema/API convites, migration transacional, UI de emissão, templates/Resend/outbox | Integração unicidade/atomicidade; E2E nominal, entrega capturada e recuperação; smoke Resend real |
| UH 05 T5 — tela/API emissão — [DMe5hpo0](https://trello.com/c/DMe5hpo0) | Serviço/schema/API convites, migration transacional, UI de emissão, templates/Resend/outbox | Integração unicidade/atomicidade; E2E nominal, entrega capturada e recuperação; smoke Resend real |
| UH 05 T6 — template convite — [TPTErgg9](https://trello.com/c/TPTErgg9) | Serviço/schema/API convites, migration transacional, UI de emissão, templates/Resend/outbox | Integração unicidade/atomicidade; E2E nominal, entrega capturada e recuperação; smoke Resend real |
| UH 05 T7 — envio Resend — [Gn6K2QqX](https://trello.com/c/Gn6K2QqX) | Serviço/schema/API convites, migration transacional, UI de emissão, templates/Resend/outbox | Integração unicidade/atomicidade; E2E nominal, entrega capturada e recuperação; smoke Resend real |
| UH 02 T1 — perfil convidado — [8T2S4F4v](https://trello.com/c/8T2S4F4v) | Convite público, acesso postal, cadastro, área convidado, RLS e migrations de provas | Integração OTP/vínculo/prova por sessão; E2E novo/existente/encaminhado/expirado/dois convites |
| UH 02 T2 — Auth pelo convite — [BaeOFNqG](https://trello.com/c/BaeOFNqG) | Convite público, acesso postal, cadastro, área convidado, RLS e migrations de provas | Integração OTP/vínculo/prova por sessão; E2E novo/existente/encaminhado/expirado/dois convites |
| UH 02 T3 — validar convite — [GElCLtcN](https://trello.com/c/GElCLtcN) | Convite público, acesso postal, cadastro, área convidado, RLS e migrations de provas | Integração OTP/vínculo/prova por sessão; E2E novo/existente/encaminhado/expirado/dois convites |
| UH 02 T4 — formulário convidado — [RXxz79DD](https://trello.com/c/RXxz79DD) | Convite público, acesso postal, cadastro, área convidado, RLS e migrations de provas | Integração OTP/vínculo/prova por sessão; E2E novo/existente/encaminhado/expirado/dois convites |
| UH 02 T5 — Auth/perfil — [xZ4lSf1c](https://trello.com/c/xZ4lSf1c) | Convite público, acesso postal, cadastro, área convidado, RLS e migrations de provas | Integração OTP/vínculo/prova por sessão; E2E novo/existente/encaminhado/expirado/dois convites |
| UH 02 T6 — perfil/convite — [Ky2yva4M](https://trello.com/c/Ky2yva4M) | Convite público, acesso postal, cadastro, área convidado, RLS e migrations de provas | Integração OTP/vínculo/prova por sessão; E2E novo/existente/encaminhado/expirado/dois convites |
| UH 06 T1 — endpoint resposta — [DySnLXcX](https://trello.com/c/DySnLXcX) | API PATCH, schema/resposta transacional, UI, confirmação e recuperação | Integração corrida/idempotência/recusa; E2E persistência nos dois lados e falha de confirmação; smoke Resend real |
| UH 06 T2 — atualizar situação — [6ofI9v7D](https://trello.com/c/6ofI9v7D) | API PATCH, schema/resposta transacional, UI, confirmação e recuperação | Integração corrida/idempotência/recusa; E2E persistência nos dois lados e falha de confirmação; smoke Resend real |
| UH 06 T3 — tela resposta — [rWyJ0AAS](https://trello.com/c/rWyJ0AAS) | API PATCH, schema/resposta transacional, UI, confirmação e recuperação | Integração corrida/idempotência/recusa; E2E persistência nos dois lados e falha de confirmação; smoke Resend real |
| UH 06 T4 — tela/API resposta — [E6dn4AGV](https://trello.com/c/E6dn4AGV) | API PATCH, schema/resposta transacional, UI, confirmação e recuperação | Integração corrida/idempotência/recusa; E2E persistência nos dois lados e falha de confirmação; smoke Resend real |
| UH 06 T5 — e-mail confirmação — [PrbOvwCF](https://trello.com/c/PrbOvwCF) | API PATCH, schema/resposta transacional, UI, confirmação e recuperação | Integração corrida/idempotência/recusa; E2E persistência nos dois lados e falha de confirmação; smoke Resend real |

## Jornadas comprovadas

- Organizador cria conta e evento; recarregar preserva dados. Campos inválidos/CPF/e-mail repetidos são tratados; tentativa duplicada de CPF compensa a identidade Auth recém-criada. Falha de compensação tem teste unitário específico e orientação de suporte, sem afirmar remoção inexistente.
- Outro organizador, convidado sem vínculo e anônimo não alcançam dados privados. Alterar `user_metadata` não concede papel. Chamadas diretas de gravação/RPC privilegiada pelo browser são rejeitadas.
- Emissão nominal grava convite/outbox juntos; convite duplicado não produz segunda notificação. Link público mascara e-mail e não mostra CPF/telefone; GET não cria conta/perfil/resposta.
- Link postal real cria sessão, prova, perfil e vínculo. Conta existente é reutilizada e conserva papel legítimo. Cadastro organizador auto-confirmado/senha não substitui prova postal da sessão para capturar convite.
- Confirmação/recusa são persistidas e visíveis nos dois lados. Quatro respostas concorrentes geram um estado e uma notificação. Troca de decisão é rejeitada; repetir a mesma resposta é idempotente.
- Interrupção do Mailpit conserva convite/presença e mostra falha. Recuperação reusa a mesma notificação, inclusive após dez tentativas; mensagens enviadas ficam sem botão de reenvio.
- Verificar B após A mantém ambos no mesmo navegador, inclusive histórico expirado de A. Sessões por senha anteriores/posteriores não herdam prova nem acesso guest.
- Cadastro criado seguido de falha de rede no login automático orienta entrar, sem repetir criação. Logout encerra acesso. Labels, campos, mensagens e ausência de overflow mobile foram exercitados na jornada; validação da UI direciona foco ao campo inválido.

## Resend com remetente padrão

Remetente: `Evently <onboarding@resend.dev>`. A integração usou a chave fornecida, mantida privada. `tests/manual/resend.mjs` chamou os endpoints reais da aplicação para emitir convite, solicitar/verificar acesso, cadastrar convidado e confirmar presença; recebeu os três IDs do provedor e verificou idempotência da resposta. Usuários sintéticos locais removidos depois.

| Mensagem | ID no Resend | Estado consultado |
|---|---|---|
| Convite | `01a12300-c0ac-75b0-bead-29119ace3478` | `delivered` (simulado) |
| Acesso postal | `01a12300-ca77-72e4-b22e-c3cca765ed5a` | `delivered` (simulado) |
| Confirmação | `01a12300-ceb0-76ed-a6d1-5dadef6a6a05` | `delivered` (simulado) |

O destinatário foi o [simulador oficial Resend](https://resend.com/docs/dashboard/emails/send-test-emails), não uma caixa humana. O remetente padrão tem [restrição de destinatários](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain): e-mail da conta Resend e simuladores oficiais. Não foi cadastrado/conectado um domínio, conforme solicitado. Aceitação/estado simulado não equivalem a recebimento humano externo.

## Decisões de execução e limites

- UI delegada a um implementador; backend e integração coordenados no mesmo worktree isolado. Nenhuma implementação concorrente em arquivos compartilhados.
- Callback passou a clique/POST explícito para evitar consumo de OTP por scanners de e-mail.
- Supabase dedicado local usado porque a URL remota antiga não respondeu e o projeto Evently não estava entre os projetos acessíveis. Não foram alterados projetos INAER/Ronchetti.
- Prova postal vinculada à sessão exata; protege o fluxo de convite sem refazer o cadastro organizador existente. Senha de organizador sozinha não libera dados de participante. Continuidades copiadas apenas da sessão anterior verificada no mesmo cliente/usuário.
- Remetente padrão Resend configurado conforme instrução do usuário; disparos gerais dependem das restrições do provedor, não de uma liberação na aplicação.
- Worker é executável e autenticado; scheduler remoto precisa ser conectado no ambiente de deploy. Nenhum cron remoto/deploy/push foi criado.

Rollback e instalação estão no [README](../README.md). A branch contém commits locais reais; `.env*` privadas, relatórios/traces, temporários de Supabase e artefatos de agente ficam fora do Git. O diretório primário e suas mudanças foram preservados.

**Pendências externas para encerrar o aceite completo do plano:** projeto Supabase atual/histórico compatível, URL pública de homologação, scheduler do worker no deploy, destinatário da própria conta Resend e confirmação de recebimento dos três e-mails na caixa controlada. Nenhuma dessas pendências invalida os fluxos locais aprovados; elas impedem declarar entrega publicada/homologada externamente.
