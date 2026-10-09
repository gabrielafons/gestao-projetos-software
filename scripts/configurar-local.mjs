import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (
  !readFileSync("supabase/config.toml", "utf8").includes(
    'project_id = "evently-sprint1"',
  )
)
  throw new Error("Configuração não corresponde ao ambiente dedicado Evently.");
if (existsSync(".env.local"))
  throw new Error(
    ".env.local já existe. Preserve sua configuração; o script cria apenas arquivos novos.",
  );
const output = execFileSync("supabase", ["status", "-o", "env"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
const values = Object.fromEntries(
  [...output.matchAll(/^(\w+)="(.*)"$/gm)].map((m) => [m[1], m[2]]),
);
if (
  !["http://127.0.0.1:55431", "http://localhost:55431"].includes(values.API_URL)
)
  throw new Error("API local Evently não encontrada.");
for (const key of ["ANON_KEY", "SERVICE_ROLE_KEY"])
  if (!values[key]) throw new Error("Supabase local não está pronto.");
const env = {
  NEXT_PUBLIC_SUPABASE_URL: values.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
  APP_URL: "http://localhost:3100",
  EMAIL_TRANSPORT: "local",
  EMAIL_LOCAL_URL: "http://127.0.0.1:55434",
  ALLOW_LOCAL_EMAIL: "true",
  NOTIFICATION_WORKER_TOKEN: randomBytes(32).toString("hex"),
};
writeFileSync(
  ".env.local",
  Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
console.log(
  "Ambiente dedicado configurado em .env.local; credenciais não impressas.",
);
