import "server-only";
import { randomBytes, createHash } from "node:crypto";
export function criarToken() {
  return randomBytes(32).toString("hex");
}
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
