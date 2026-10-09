import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
function arquivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? arquivos(join(dir, e.name))
      : e.name.endsWith(".test.ts")
        ? [join(dir, e.name)]
        : [],
  );
}
const result = spawnSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--import",
    "tsx",
    "--test",
    ...arquivos("src"),
  ],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
