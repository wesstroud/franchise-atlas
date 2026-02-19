import crypto from "crypto";

export function sha256Buffer(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function deterministicRowHash(parts: Array<string | number | null | undefined>): string {
  const normalized = parts.map((v) => (v ?? "").toString().trim().toLowerCase()).join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}