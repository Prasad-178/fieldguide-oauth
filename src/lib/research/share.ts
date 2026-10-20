import { createHmac, timingSafeEqual } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { savedGuide, type SavedGuide } from "./schema";

// Signed, compressed snapshots keep shared guides independent of a server's disk.
// The fragment is sent to verification via POST, never in server access-log URLs.
function secret() {
  const value = process.env.GUIDE_SIGNING_SECRET;
  if (!value || value.length < 32) throw new Error("Guide signing is not configured.");
  return value;
}
export function signGuide(guide: SavedGuide) {
  const payload = gzipSync(JSON.stringify(savedGuide.parse(guide))).toString("base64url");
  if (payload.length > 24000) throw new Error("This guide is too large to share.");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
export function verifyGuide(token: string): SavedGuide {
  if (token.length > 24100) throw new Error("Guide link is too large.");
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !/^[\w-]+$/.test(payload) || !/^[\w-]{43}$/.test(signature)) throw new Error("Invalid guide link.");
  const expected = createHmac("sha256",secret()).update(payload).digest();
  const actual = Buffer.from(signature,"base64url");
  if (actual.length !== expected.length || !timingSafeEqual(expected,actual)) throw new Error("This guide link was changed or belongs to a different deployment.");
  return savedGuide.parse(JSON.parse(gunzipSync(Buffer.from(payload,"base64url"),{ maxOutputLength: 90000 }).toString("utf8")));
}
