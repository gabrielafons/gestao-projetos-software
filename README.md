# Evently - Gestão de Eventos Corporativos

# Integrantes:
Gabriel Afonso dos Santos (Dev)<br>
Giovane Contreras Oba (PO)<br>
Gustavo Trovó Ramos de Souza (SM)<br>
Igor de Araujo Borges (Dev)<br>

# Descrição do Projeto: 
O Evently é uma plataforma web para gestão de eventos corporativos realizados por convite, sem venda de ingressos. A empresa organizadora emite convites nominais e, no momento em que o convidado confirma presença, o sistema libera automaticamente uma trilha de material preparatório sobre os temas do evento, além de um guia com todas as informações operacionais. Essa trilha inclui uma aula preparatória, que aborda os temas que serão tratados no evento. Durante o evento o convidado terá acesso a um quiz relacionado ao que foi apresentado, e ao atingir nota mínima, garante o direito a um brinde. O brinde é entregue em algum balcão a partir da leitura do código de acesso único de cada participante. No dia, a entrada e a saída são registradas por leitura desse código, permitindo apurar presença efetiva. Desistências podem ser formalizadas e o convite transferido a um substituto, evitando vagas ociosas.

---

# Como rodar o projeto

## Pré-requisitos

- **Node.js 20+** (o projeto foi desenvolvido no Node 22)
- Uma conta no [Supabase](https://supabase.com) com um projeto criado

## 1. Instalar as dependências

```bash
npm install
```

## 2. Configurar as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com as chaves do seu projeto Supabase
(painel do Supabase → *Project Settings* → *API*):

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon` / `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` — **nunca** versionar |

## 3. Aplicar as migrations do banco

As migrations ficam em `supabase/migrations/`, numeradas na ordem de execução.
Aplique pelo **SQL Editor** do painel do Supabase (copiando o conteúdo de cada
arquivo, na ordem) ou, com a [CLI do Supabase](https://supabase.com/docs/guides/cli)
instalada e o projeto vinculado:

```bash
supabase db push
```

## 4. Subir a aplicação

```bash
npm run dev
```

A aplicação sobe em <http://localhost:3000>.
O cadastro de organizador fica em `/cadastro/organizador`.

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | ambiente de desenvolvimento |
| `npm run build` | build de produção |
| `npm start` | executa o build de produção |
| `npm test` | roda a suíte de testes |
| `npm run typecheck` | checagem de tipos (`tsc --noEmit`) |
| `npm run lint` | ESLint |

---

# Arquitetura

## Tecnologias

As escolhas seguem a análise de reuso registrada na
[Wiki do projeto](https://github.com/gabrielafons/top-adv-eng-soft/wiki/Oportunidades-de-Reuso):

| Camada | Tecnologia | Papel |
|---|---|---|
| Aplicação | **Next.js (React + TypeScript)** sobre Node.js | interface web e API do sistema |
| Autenticação | **Supabase Auth** | credenciais e controle de acesso por perfil |
| Banco de dados | **Postgres** (Supabase) | persistência, com RLS por usuário |
| Validação | **Zod** | regras compartilhadas entre UI e API |

Previstos para as próximas sprints: **Resend + React Email** (convites),
**qrcode** e **@zxing/library** (check-in por QR Code).

## Organização do código

A lógica de negócio fica **no código da aplicação** — não em Edge Functions nem
em triggers de banco. As responsabilidades são separadas em camadas:

```
src/
├── app/
│   ├── api/organizadores/route.ts   endpoint de cadastro (HTTP apenas)
│   ├── api/sessao/route.ts          login e logout
│   ├── cadastro/organizador/        formulário de cadastro
│   ├── login/                       tela de login
│   ├── painel/                      área do organizador (exige sessão)
│   └── page.tsx                     home
├── components/                      componentes de UI reutilizáveis
├── lib/
│   ├── env.ts                       leitura validada das variáveis de ambiente
│   ├── perfis.ts                    perfis de acesso e rota inicial de cada um
│   ├── services/                    regra de negócio (não conhece HTTP)
│   ├── supabase/                    clientes: navegador, servidor e admin
│   └── validators/                  schemas de validação + testes
├── middleware.ts                    renova a sessão e protege as rotas
└── types/database.ts                tipos que espelham o schema

supabase/migrations/                 schema versionado, uma migration por tarefa
```

O fluxo de uma requisição de cadastro:

```
formulário  →  validators  →  route handler  →  service  →  Supabase
  (UI)         (Zod)           (HTTP)          (negócio)   (Auth + Postgres)
```

O **mesmo** schema Zod valida na tela e no servidor, então a mensagem que o
usuário vê nunca diverge da regra aplicada de fato.

## Modelo de dados

| Tabela | História | Conteúdo |
|---|---|---|
| `organizadores` | UH 01 | perfil do organizador (1:1 com `auth.users`) |
| `convidados` | UH 02 | perfil do convidado (1:1 com `auth.users`) |
| `eventos` | UH 03 | evento criado por um organizador |
| `convites` | UH 05 | convite nominal, com código único de acesso |

Decisões aplicadas em todas as tabelas:

- **Senhas não são armazenadas nas tabelas de perfil.** Ficam sob a guarda do
  Supabase Auth, em `auth.users`.
- **RLS habilitado** em todas: cada usuário só alcança os próprios dados, e a
  regra é garantida pelo banco — não pela aplicação.
- **Toda chave estrangeira tem índice**, já que o Postgres não os cria sozinho.
- CPF, e-mail e código de convite têm restrição de unicidade.

## Endpoints

### `POST /api/organizadores`

Cadastra um organizador (UH 01 — T2).

```json
{
  "nome": "Giovane Contreras Oba",
  "email": "giovane@exemplo.com",
  "cpf": "52998224725",
  "telefone": "11987654321",
  "senha": "Evently@2026"
}
```

Regras aplicadas (as mesmas na tela e no servidor):

| Campo | Regra |
|---|---|
| `nome` | nome e sobrenome, até 50 caracteres, apenas letras |
| `email` | formato válido, até 254 caracteres (RFC 5321) |
| `cpf` | 11 dígitos, conferidos pelos dígitos verificadores |
| `telefone` | DDD válido + 8 ou 9 dígitos |
| `senha` | 8 caracteres ou mais, com maiúscula, minúscula, número e símbolo |

| Status | Situação |
|---|---|
| `201` | cadastro realizado |
| `400` | dados obrigatórios ausentes ou inválidos (retorna `erros` por campo) |
| `409` | e-mail ou CPF já cadastrado |
| `500` | falha inesperada |

### `POST /api/sessao`

Abre a sessão (UH 04 — T2/T5). Retorna o perfil e a rota inicial dele.

```json
{ "email": "giovane@exemplo.com", "senha": "Evently@2026" }
```

| Status | Situação |
|---|---|
| `200` | sessão aberta |
| `400` | e-mail ou senha não informados |
| `401` | e-mail ou senha incorretos |
| `403` | conta sem perfil definido |

### `DELETE /api/sessao`

Encerra a sessão. Responde `204`.

---

# Controle de acesso

O perfil (`organizador`, `convidado` ou `operador`) é gravado nos metadados do
usuário no Supabase Auth durante o cadastro, e decide o que cada pessoa alcança:

| Perfil | Destino ao entrar |
|---|---|
| organizador | `/painel` |
| convidado | `/meus-convites` |
| operador | `/operacao` |

A proteção acontece em duas camadas: o `middleware.ts` barra quem não tem
sessão antes da página carregar, e cada página protegida confere o perfil —
para que um convidado autenticado não alcance a área do organizador apenas
digitando a URL.
