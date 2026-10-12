import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "undead_slayer_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: number;
  username: string;
  timestamp: number;
};

function getSessionSecret(): string | null {
  // Configure a long, random SESSION_SECRET in the hosting provider.
  // Do not use DATABASE_URL or commit any secret into source control.
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeSignatureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setSessionUser(userId: number, username: string) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Session security is not configured. Set SESSION_SECRET (at least 32 characters) in the deployment environment.");
  }

  const cookieStore = await cookies();
  const payload: SessionPayload = { userId, username, timestamp: Date.now() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const value = `${encoded}.${sign(encoded, secret)}`;

  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSessionUser(): Promise<{ userId: number; username: string } | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  try {
    const separator = value.lastIndexOf(".");
    if (separator <= 0) return null;

    const encoded = value.slice(0, separator);
    const signature = value.slice(separator + 1);
    if (!safeSignatureEqual(signature, sign(encoded, secret))) return null;

    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<SessionPayload>;

    if (
      !Number.isSafeInteger(parsed.userId) ||
      (parsed.userId ?? 0) <= 0 ||
      typeof parsed.username !== "string" ||
      !parsed.username ||
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp > SESSION_MAX_AGE_SECONDS * 1000 ||
      parsed.timestamp > Date.now() + 60_000
    ) {
      return null;
    }

    return { userId: parsed.userId as number, username: parsed.username };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
