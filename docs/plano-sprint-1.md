# Evently — Plano de entrega da Sprint 1

Data da auditoria: 09/10/2026. Estado: planejamento concluído; implementação não iniciada.

## Objetivo e escopo

Entregar as seis histórias da lista **Sprint 1 - 11 pts** e as **33 tarefas atualmente em Concluído**, com interface, API, persistência, autenticação, e-mails e testes integrados. O status do Trello é uma declaração de trabalho; a entrega depende de evidência de funcionamento.

Jornada de aceite:

1. Organizador cria sua conta e entra na plataforma.
2. Cadastra um evento e o encontra no painel.
3. Emite um convite nominal; o destinatário recebe o e-mail com o link correto.
4. Convidado abre o convite, comprova acesso ao e-mail e conclui seu cadastro.
5. Confirma ou recusa presença; a resposta permanece no banco após recarregar a página.
6. Organizador acompanha a resposta; quando houver confirmação, o convidado recebe o e-mail previsto.

UH 07–UH 14 permanecem fora desta entrega: guia operacional, materiais, cadastro de operador, desistência/transferência, portaria, indicadores completos, quiz e brindes. O painel mínimo de eventos e respostas integra a sprint 1 para tornar sua jornada utilizável. A leitura de QR Code não é requisito desta sprint.

Nesta etapa foram feitas consultas e verificações locais. Nenhum card foi alterado, nenhuma migration foi aplicada, nenhuma conta foi criada e nenhum e-mail foi enviado.

## Fontes e evidências

- [Quadro Evently](https://trello.com/b/Yb0lMTbP/evently): leitura das seis histórias e das descrições das 33 tarefas pela sessão autenticada do Chrome. A Fazer, Em Andamento e Em Teste estavam vazias.
- Repositório: `https://github.com/gabrielafons/gestao-projetos-software`.
- Checkout auditado: `feat/setup-inicial-autoria`, commit `0532cde`; `origin/main` atualizado na consulta, commit `3f4bd53`. A diferença entre as árvores é apenas `.gitignore`; não há uma implementação funcional mais completa em main.
- Stack instalada: Next.js 16.3.4, React 19.2.8, Supabase JS 2.116.0, Supabase SSR 0.12.7 e Zod 4.6.2, conforme package.json. Não se propõe reescrever a aplicação nem trocar o stack.
- Verificações executadas: **49 testes passando**, typecheck, lint e build aprovados. O build emite aviso de descontinuação de `middleware.ts`.
- A suíte existente cobre validadores, leitura de perfis e redirecionamento. Não comprova cadastro/login com Supabase real, RLS, envio de e-mails nem as jornadas faltantes.
- `.env` contém configuração de Supabase, mas `mgficqncyxmaszylhknx.supabase.co` retornou **ENOTFOUND** na resolução DNS. As consultas sem registros às quatro tabelas falharam por conexão. Não foi possível confirmar schema remoto ou migrations aplicadas; a causa do hostname indisponível não foi determinada.
- Nenhuma variável do Resend está configurada no `.env` auditado.

Referências técnicas conferidas:

- [Wiki — Oportunidades de Reuso](https://github.com/gabrielafons/top-adv-eng-soft/wiki/Oportunidades-de-Reuso): manter Next.js, Supabase Auth e Resend/React Email; regras de negócio em módulos da aplicação.
- [Supabase — RLS e metadados](https://supabase.com/docs/guides/database/postgres/row-level-security): dados de autorização não devem depender de `user_metadata`, editável pelo usuário; usar `app_metadata` e relações verificadas no banco.
- [Supabase — criação administrativa de usuário](https://supabase.com/docs/reference/javascript/auth-admin-createuser): operações administrativas ficam exclusivamente no servidor.
- [Next.js — middleware para proxy](https://nextjs.org/docs/messages/middleware-to-proxy): atualização pequena da convenção, preservando a renovação de cookies.
- [Resend — envio](https://resend.com/docs/api-reference/emails/send-email) e [idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys): envio com remetente validado, identificação da mensagem e proteção contra reenvios repetidos.

## Diagnóstico por história

| História | Código atual | Trabalho restante |
|---|---|---|
| [UH 01 — Organizador, 2 pts](https://trello.com/c/ERgCKCYO) | Tabela/migration, API, serviço, formulário, validação e tentativa de login automático | Comprovar persistência e login reais; testar duplicidade, compensação e falhas; melhorar erros de configuração |
| [UH 04 — Login, 2 pts](https://trello.com/c/cje3iY6U) | SDK, API de sessão, login/logout, proteção de páginas e redirecionamento seguro | Corrigir fonte de autorização; completar acesso do convidado e callback; conferir cookies, sessões e permissões |
| [UH 03 — Evento, 2 pts](https://trello.com/c/lHRQmPCs) | Apenas tabela/migration e tipos | API, serviço, validador, formulário, listagem e detalhe conectado ao painel |
| [UH 05 — Convites, 3 pts](https://trello.com/c/bgmY93rP) | Apenas tabela/migration e tipos | Emissão, validação, formulário, link, template, envio e acompanhamento de falhas |
| [UH 02 — Convidado, 1 pt](https://trello.com/c/p6AKP3cm) | Apenas tabela/migration e tipos | Validar convite, autenticar destinatário, cadastrar perfil, vincular convite e disponibilizar área do convidado |
| [UH 06 — Resposta, 1 pt](https://trello.com/c/4zrPyq6w) | Valores de status previstos no schema | API, transição de estado, tela, integração e e-mail de confirmação |

**Contagem:** 13 tarefas têm implementação correspondente no checkout; 20 não têm. Nenhuma história será considerada entregue apenas por essa contagem: todas passam pela homologação integrada.

## Matriz das 33 tarefas

“Existe” significa código presente, sujeito a revisão e homologação. “Schema” significa migration local e tipos, sem comprovação no banco remoto.

| Tarefa | Card | Evidência atual | Ação planejada |
|---|---|---|---|
| UH 01 T1 — perfil organizador | [8q89yaUn](https://trello.com/c/8q89yaUn) | Schema | Conferir migration, constraints e RLS no ambiente de teste |
| UH 01 T2 — endpoint cadastro | [X3h5RG3P](https://trello.com/c/X3h5RG3P) | Existe: `/api/organizadores` | Testar Auth + perfil + compensação |
| UH 01 T3 — validar organizador | [O8fgTcCa](https://trello.com/c/O8fgTcCa) | Existe: validators | Preservar regras e testar duplicidades no fluxo real |
| UH 01 T4 — formulário | [9jPtVx1u](https://trello.com/c/9jPtVx1u) | Existe: cadastro/organizador | Homologar mensagens e acesso por teclado |
| UH 01 T5 — integrar Auth/perfil | [gTOvyPWo](https://trello.com/c/gTOvyPWo) | Existe: API + serviço + login automático | Confirmar sessão e tratar cadastro concluído seguido de falha de login |
| UH 04 T1 — SDK client/server | [fW34fDjs](https://trello.com/c/fW34fDjs) | Existe: lib/supabase | Verificar configuração e cookies |
| UH 04 T2 — autenticar | [UnhcoNfO](https://trello.com/c/UnhcoNfO) | Existe: signInWithPassword | Manter senha para organizador; adicionar acesso por e-mail para convidado |
| UH 04 T3 — perfis/permissões | [IkcPTDPW](https://trello.com/c/IkcPTDPW) | Existe, usa user_metadata | Migrar autorização para fonte confiável, validar também banco/API |
| UH 04 T4 — tela login | [SuTJm9fO](https://trello.com/c/SuTJm9fO) | Existe | Completar continuidade da jornada por convite |
| UH 04 T5 — tela/SDK | [4ifiO66R](https://trello.com/c/4ifiO66R) | Existe | Testar destinos por perfil e callback |
| UH 03 T1 — tabela eventos | [1JbEgA0g](https://trello.com/c/1JbEgA0g) | Schema | Preservar dados e ownership |
| UH 03 T2 — endpoint evento | [bvQ9a0f9](https://trello.com/c/bvQ9a0f9) | Ausente | POST `/api/eventos` vinculado ao organizador autenticado |
| UH 03 T3 — validar evento | [ufIN1xsw](https://trello.com/c/ufIN1xsw) | Ausente | Schema compartilhado: nome, data, horário, local |
| UH 03 T4 — formulário evento | [KTblXqsZ](https://trello.com/c/KTblXqsZ) | Ausente | Formulário conectado e estados de carregamento/erro/sucesso |
| UH 03 T5 — integrar cadastro | [EperiLZN](https://trello.com/c/EperiLZN) | Ausente | Persistir, redirecionar para detalhe e atualizar painel |
| UH 05 T1 — convite/evento | [YxqzOsni](https://trello.com/c/YxqzOsni) | Schema | Ajustar campos exigidos, tokens, validade e integridade |
| UH 05 T2 — emitir convite | [eEuOgkla](https://trello.com/c/eEuOgkla) | Ausente | POST `/api/convites`, ownership e unicidade |
| UH 05 T3 — validar convidado | [rTVCutiB](https://trello.com/c/rTVCutiB) | Ausente | Validar dados obrigatórios sem divergência UI/API |
| UH 05 T4 — tela emissão | [CHN5TawV](https://trello.com/c/CHN5TawV) | Ausente | Nome, e-mail, telefone e CPF conforme descrição |
| UH 05 T5 — tela/API emissão | [DMe5hpo0](https://trello.com/c/DMe5hpo0) | Ausente | Envio conectado e retorno do estado do e-mail |
| UH 05 T6 — template convite | [TPTErgg9](https://trello.com/c/TPTErgg9) | Ausente | Evento, data, local e link absoluto de acesso |
| UH 05 T7 — envio Resend | [Gn6K2QqX](https://trello.com/c/Gn6K2QqX) | Ausente | Envio automático e repetição segura após falha |
| UH 02 T1 — perfil convidado | [8T2S4F4v](https://trello.com/c/8T2S4F4v) | Schema | Conferir Auth, unicidade e RLS |
| UH 02 T2 — Auth pelo convite | [BaeOFNqG](https://trello.com/c/BaeOFNqG) | Ausente | Iniciar acesso por e-mail a partir de convite válido |
| UH 02 T3 — validar convite | [GElCLtcN](https://trello.com/c/GElCLtcN) | Ausente | Bloquear inexistente, expirado, cancelado ou transferido |
| UH 02 T4 — formulário convidado | [RXxz79DD](https://trello.com/c/RXxz79DD) | Ausente | Nome, CPF, e-mail e telefone; e-mail nominal protegido |
| UH 02 T5 — Auth/perfil | [xZ4lSf1c](https://trello.com/c/xZ4lSf1c) | Ausente | Salvar perfil após verificação de identidade e validar falhas |
| UH 02 T6 — perfil/convite | [Ky2yva4M](https://trello.com/c/Ky2yva4M) | Apenas FK; card sem descrição | Vincular ao usuário correto sem se apropriar de convite alheio |
| UH 06 T1 — endpoint resposta | [DySnLXcX](https://trello.com/c/DySnLXcX) | Ausente | PATCH `/api/convites/[id]` |
| UH 06 T2 — atualizar situação | [6ofI9v7D](https://trello.com/c/6ofI9v7D) | Apenas enum/constraint | Transição condicional e idempotência |
| UH 06 T3 — tela resposta | [rWyJ0AAS](https://trello.com/c/rWyJ0AAS) | Ausente | Botões confirmar/recusar e estado persistido |
| UH 06 T4 — tela/API resposta | [E6dn4AGV](https://trello.com/c/E6dn4AGV) | Ausente | Integrar PATCH, recarregar e refletir no painel |
| UH 06 T5 — e-mail confirmação | [PrbOvwCF](https://trello.com/c/PrbOvwCF) | Ausente | Enviar uma notificação por confirmação efetiva |

## Decisões para fechar o contrato

1. **Preservar o cadastro existente.** O card UH 01 T5 cita `signUp()`, mas o código usa criação administrativa no servidor seguida de gravação do perfil e login. Manter a solução se passar nos testes de identidade, compensação e acesso; registrar a equivalência funcional na evidência. Não expor a service role nem levar controle de perfil ao navegador.
2. **Autorização confiável.** UH 04 T3 cita `user_metadata`; isso serve para dados de apresentação, mas não como autoridade para permissões. Usar metadados administrados pelo servidor e vínculos persistidos. Contas antigas devem ser migradas a partir dos perfis existentes, nunca do papel que o usuário declarar. Conferir páginas, endpoints e acesso direto ao banco.
3. **Convidado por link de acesso ao e-mail.** Os formulários de UH 02 não exigem senha, e UH 04 permite magic link. Manter login por senha do organizador e usar acesso por e-mail do convidado. Contrato: convite válido → solicitar acesso ao e-mail nominal → verificar link/callback → completar perfil → vincular convite → área do participante. GET de convite não cria conta nem altera presença, inclusive quando scanners de e-mail abrirem o link.
4. **Identidade existente.** Reutilizar Auth quando o e-mail já tem conta; nunca criar duplicata, trocar senha ou substituir o papel existente. Permitir associação de convidado à mesma identidade, com permissões derivadas dos respectivos vínculos. O convidado não vira organizador por editar metadados ou chamar um endpoint diretamente.
5. **Dados da emissão.** UH 05 T3 só menciona nome/e-mail, mas T4 exige também CPF/telefone. Implementar os quatro no formulário/API, validar os quatro e guardar os dados complementares com acesso restrito. No cadastro por convite, os dados podem ser pré-preenchidos após autenticação; CPF/telefone não aparecem na página pública nem no e-mail. O participante revisa seus dados.
6. **Código e token de convite separados.** Preservar `codigo` como identificador único do participante. Usar token aleatório de alta entropia, armazenado como hash, para a URL nominal. Não usar IDs sequenciais ou dados pessoais como credencial. Token de convite não substitui prova de titularidade do e-mail.
7. **Validade.** Na emissão, persistir `expira_em` e mostrar a vigência. Proposta inicial: até o início do evento, interpretado em `America/Sao_Paulo`; validar novamente em cada operação. Convites antigos com validade nula exigem tratamento explícito antes de liberá-los. Não inventar capacidade/vagas: os cards não definem campo ou regra de lotação.
8. **Resposta.** Aceitar `pendente → confirmado` ou `pendente → recusado`. Repetir a mesma resposta retorna o estado já gravado. Troca posterior entre confirmado/recusado não faz parte dos critérios desta sprint; mostrar a resposta e bloquear a mudança nesta entrega. Cancelado/transferido/expirado não responde. Atualização condicional evita duas respostas conflitantes em paralelo.
9. **Envio separado da presença.** O status do convite não representa status do e-mail. Persistir a operação de negócio e registrar a notificação pendente na mesma transação; enviar fora dela. Falha do Resend não apaga convite nem desfaz confirmação. Estado visível e repetição segura permitem concluir o fluxo sem duplicar convite ou e-mail.
10. **Transações com fronteira pequena.** Manter validação, autorização e regras nos serviços da aplicação. Usar funções transacionais restritas para vincular perfil/convite, atualizar resposta e registrar notificações quando necessário; elas garantem integridade e concorrência, sem transportar toda a lógica de negócio para o banco. Auth e Postgres não compartilham a mesma transação: compensar somente recursos criados naquela tentativa e registrar falhas de compensação.

## Plano de execução em ordem de dependência

### Etapa 0 — Ambiente e base de trabalho

- Criar branch `feat/sprint-1-completa` a partir de main atualizado, preservando alterações locais eventualmente existentes.
- Identificar se o Supabase configurado foi pausado, removido ou substituído; confirmar URL, projeto vinculado e histórico de migrations. Só então definir o destino de homologação.
- Preparar Supabase local/isolado para integração e RLS. Testes não podem depender de dados de produção.
- Configurar Resend, remetente/domínio e URL base da aplicação no ambiente de teste; adicionar apenas nomes/exemplos das variáveis ao `.env.example`.
- Adicionar infraestrutura de testes de integração e navegador, sem trocar a suíte atual. Versionar checks reproduzíveis e dados sintéticos de teste.

Verificação: instalação reproduzível, migrations do zero no ambiente isolado, conexão Auth/Postgres e template de e-mail validável. Falta de configuração bloqueia homologação externa, não a escrita/testes locais.

### Etapa 1 — Fechar cadastro e autorização (UH 01 / UH 04)

- Testes primeiro: cadastro válido, CPF/e-mail duplicado, falha no perfil, falha de compensação, login inválido, logout, cookies e acesso por papel.
- Corrigir autorização baseada em metadados editáveis, exigir vínculo real e migrar contas legadas de forma auditável.
- Centralizar os guards de API/páginas e padronizar falhas de configuração e HTTP.
- Atualizar middleware para a convenção proxy e garantir que redirects preservem cookies renovados e o destino interno seguro.
- Tratar o caso em que o cadastro foi concluído, mas login automático falhou, inclusive erro de rede no segundo pedido.

Arquivos principais: `src/lib/perfis.ts`, `src/lib/services/autenticacao.ts`, `src/lib/services/organizadores.ts`, `src/lib/supabase/*`, `src/middleware.ts` → `src/proxy.ts`, APIs e telas existentes, migrations novas.

Verificação: conta e perfil persistidos; login entra na área autorizada; papel adulterado não concede acesso; logout retira acesso. Não aprovar apenas com mocks.

### Etapa 2 — Evento completo (UH 03)

- Criar schema compartilhado e testes para os quatro campos exigidos; validar datas reais e horário, com fuso definido para comparações.
- Criar serviço de cadastro/listagem/detalhe e POST `/api/eventos`; ownership vem da sessão, nunca de `organizador_id` informado pelo cliente.
- Completar painel, formulário de novo evento e detalhe com ação de emitir convite.
- Mostrar estados vazios reais, carregamento, erros de validação/conexão e confirmação. O painel consulta o banco; não permanece como placeholder.

Novos arquivos previstos: `src/lib/validators/evento.ts`, `src/lib/services/eventos.ts`, `src/app/api/eventos/route.ts`, `src/app/painel/eventos/novo/page.tsx`, `src/app/painel/eventos/[id]/page.tsx`, componentes de formulário/listagem. Alterar `src/app/painel/page.tsx` e tipos quando necessário.

Verificação: organizador A cria e gerencia seu evento; B e convidado não podem ler/alterar dados privados de A pela API ou banco. Recarregar mantém o evento.

### Etapa 3 — Emissão e entrega do convite (UH 05)

- Testes primeiro para campos, evento alheio, evento inexistente, duplicidade por evento/e-mail e tentativas repetidas.
- Evoluir schema por migration aditiva: dados complementares, hash do token, validade e registros de notificação.
- Criar POST `/api/convites` e listagem de convites no detalhe do evento. Retornar convite persistido e estado da notificação separadamente.
- Criar formulário com os quatro campos e validadores compartilhados; guardar código/token no servidor.
- Implementar templates React Email, adaptador Resend e processamento de notificações persistidas. Usar chave estável de idempotência e registrar ID do provedor, tentativas e falhas sem segredos.
- Prever recuperação de pendências e reenvio autorizado pelo organizador; execução do processador protegida. O mecanismo de recuperação deve funcionar no ambiente de deploy, não depender de uma promessa em background após responder HTTP.

Novos arquivos previstos: `src/lib/validators/convite.ts`, `src/lib/services/convites.ts`, `src/lib/services/notificacoes.ts`, `src/lib/email/*`, `src/emails/convite.tsx`, `src/app/api/convites/route.ts`, formulário de convites e rotas protegidas de recuperação/reenvio. Atualizar env, tipos, pacote/lock e migrations.

Verificação: convite nominal único, associado ao evento correto; e-mail com link absoluto abre a página certa. Resend indisponível deixa falha visível e recuperável, sem nova emissão. Distinguir aceitação pelo provedor de recebimento na caixa de teste.

### Etapa 4 — Cadastro e área do convidado (UH 02 / UH 04)

- Criar página `/convite/[token]` com informação mínima do evento e tratamento de convite inválido/expirado.
- Criar solicitação de acesso por e-mail, callback de verificação e continuidade segura para o convite. Definir URLs de callback permitidas no Supabase.
- Criar `/cadastro/convidado` e POST `/api/convidados`, ambos dependentes de convite válido e identidade verificada. E-mail vem do convite/identidade; não pode ser substituído no body para capturar outro convite.
- Persistir perfil e vínculo de forma transacional/idempotente; aplicar unicidade, concorrência e compensação. Revalidar o convite no momento de concluir.
- Implementar `/meus-convites` e detalhe com informações do evento e situação do convite. Dar ao convidado leitura do evento associado por policy limitada, sem liberar participantes de terceiros.
- Endpoints públicos de solicitação de acesso precisam de limites por IP/convite e respostas que evitem expor contas existentes.

Novos arquivos previstos: `src/lib/validators/convidado.ts`, `src/lib/services/convidados.ts`, `src/app/convite/[token]/page.tsx`, `src/app/cadastro/convidado/page.tsx`, `src/app/api/convidados/route.ts`, endpoint de solicitação de acesso, `src/app/auth/confirm/route.ts`, `src/app/meus-convites/*`. Atualizar guards, login, RLS e tipos.

Verificação: convidado novo completa perfil; existente reutiliza conta; convite encaminhado não permite assumir o e-mail nominal; convite alheio não é capturado; abrir o link com scanner não cria perfil ou presença. Login do convidado chega a uma página funcional.

### Etapa 5 — Confirmação/recusa e notificação (UH 06)

- Criar testes para transições, propriedade, validade, repetição e concorrência.
- Implementar PATCH `/api/convites/[id]` com apenas `{ status: "confirmado" | "recusado" }`; usuário vinculado vem da sessão. O organizador não confirma pelo convidado nessa API.
- Criar botões de confirmar/recusar, feedback e atualização de dados. Impedir envio duplo e manter o estado após refresh.
- Registrar notificação de confirmação na transação da mudança; enviar via Resend com template próprio e repetição segura. A recusa permanece registrada sem inventar obrigação de e-mail que o card não exige.
- Atualizar a lista do organizador com as respostas e totais básicos.

Novos arquivos previstos: `src/app/api/convites/[id]/route.ts`, `src/lib/validators/resposta-convite.ts`, `src/emails/confirmacao.tsx`, componentes de resposta. Alterar serviços de convites/notificação e páginas dos dois públicos.

Verificação: confirmação/recusa persistem e aparecem aos dois lados; chamadas repetidas não duplicam notificação; corrida não grava estados contraditórios; falha de e-mail não desfaz resposta.

### Etapa 6 — Homologação e entrega

- Executar a matriz de aceite abaixo no banco isolado e repetir as jornadas essenciais no ambiente de homologação configurado.
- Validar telas desktop/mobile, teclado, labels, foco, mensagens em português e ausência de páginas prometidas que retornem 404.
- Executar suíte completa, integração/RLS, E2E, typecheck, lint e build.
- Atualizar README com variáveis, migrations, autenticação por convite, processador de e-mail e roteiro de demonstração.
- Registrar por card: arquivos, teste, resultado e evidência; tarefas sem evidência permanecem pendentes na documentação.
- Fazer commits locais por bloco com autoria/data reais; não incluir credenciais, artefatos temporários ou dados pessoais. Push/PR/publicação seguem o escopo autorizado na etapa de implementação; não estão sendo executados neste planejamento.

## Matriz mínima de aceite integrado

| Caso | Resultado obrigatório |
|---|---|
| Organizador válido | Auth e perfil criados; acesso funcional ao painel |
| Cadastro inválido/duplicado | Erros por campo/duplicidade; sem perfil ou conta órfã criada pela tentativa |
| Login inválido/logout | Acesso negado; sessão encerrada de fato |
| Perfil adulterado | Sem promoção de privilégios, inclusive chamada direta ao Supabase |
| Evento válido | Gravado e disponível no gerenciamento após refresh |
| Evento inválido ou ownership falsificado | Nenhuma criação/alteração indevida |
| Convite válido | Nominal, único por evento/e-mail, link válido e entrega verificável |
| Convite inválido/duplicado | Nenhuma duplicata; falha compreensível |
| Cadastro por convite | E-mail verificado, perfil e vínculo corretos, área acessível |
| Convite expirado/alheio/encaminhado | Sem acesso indevido ou criação/vínculo de perfil |
| Conta existente | Sem duplicar Auth nem perder privilégios legítimos anteriores |
| Confirmar presença | Status persistido, visível ao organizador e e-mail de confirmação |
| Recusar presença | Status persistido e visível ao organizador |
| Repetição/concorrência | Um resultado consistente e nenhuma notificação duplicada |
| Falha Auth/banco/Resend | Erro tratado, integridade mantida, recuperação demonstrada |
| RLS | A/B/convidado/anônimo exercitados com credenciais comuns, nunca service role como prova de isolamento |

Condição de encerramento: **33/33 tarefas com evidência**, os dois cenários de cada uma das seis histórias aprovados, jornada completa em ambiente real de homologação, instalação/migrations reproduzíveis e zero bloqueador funcional conhecido. Mocks ou build aprovado não substituem esses critérios.

## Dependências, riscos e recuperação

| Risco/dependência | Tratamento e verificação |
|---|---|
| Supabase configurado indisponível | Identificar destino correto antes de escrever no remoto; usar ambiente isolado para desenvolver; verificar histórico aplicado |
| Schema remoto diferente das migrations | Comparar antes do push; migrations corretivas novas; nunca editar silenciosamente migration já aplicada |
| Auth criado e perfil/vínculo falha | Compensação restrita à tentativa; validar também falha de compensação; preservar usuários preexistentes |
| Metadados editáveis e RLS permissiva | Autoridade confiável e testes diretos de acesso por papel/vínculo; restringir criação direta de perfis se necessária |
| Falha/demora/repetição do Resend | Notificação persistida, estado separado, chave de idempotência, recuperação protegida e teste de concorrência |
| Link divulgado ou scanner de e-mail | Token aleatório/hash, dados mínimos, prova de e-mail e nenhuma mutação no GET |
| Diferença entre campos de emissão e schema | Guardar campos exigidos de maneira restrita e revisar no cadastro; documentar contrato de UI/API |
| Validade/fuso e regras não detalhadas | Fuso São Paulo, validade explícita e testes na fronteira; não acrescentar regra de lotação sem requisito |

Rollback: código pode voltar ao commit anterior por revert. Migrations serão aditivas; em falha, desabilitar os novos fluxos e o processador de e-mail, mantendo os dados e retomando por migration corretiva. Não apagar perfis, convites ou respostas para desfazer deploy. Reverter código não reverte e-mails já enviados; homologar com destinatários controlados e preservar os registros do provedor. Rotas novas só entram no release depois que suas migrations e variáveis estiverem disponíveis.

## Próximo passo

Implementar na ordem **ambiente → cadastro/autorização → eventos → convites/e-mail → convidado → resposta → homologação**. As tarefas já existentes entram como revisão e prova de funcionamento; as faltantes entram como construção. Este arquivo é a referência inicial para a execução da sprint, sujeito apenas a ajustes demonstrados por requisitos ou evidência do ambiente.
