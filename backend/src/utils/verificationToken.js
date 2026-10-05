import crypto from "crypto";

const SECRET = process.env.APPROVAL_SECRET;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function makeToken(userId) {
  const exp = Date.now() + TTL_MS;
  const payload = `${userId}.${exp}`;
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, exp, sig] = parts;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${userId}.${exp}`)
    .digest("hex");

  // timing-safe compare
  if (
    !crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex")
    )
  ) return null;

  if (Date.now() > Number(exp)) return null;
  return { userId };
}