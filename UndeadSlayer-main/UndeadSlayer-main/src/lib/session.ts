import { cookies } from "next/headers";

const SESSION_COOKIE = "undead_slayer_session";

export async function setSessionUser(userId: number, username: string) {
  const cookieStore = await cookies();
  const payload = JSON.stringify({ userId, username, timestamp: Date.now() });
  const encoded = Buffer.from(payload).toString("base64");
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: false, // Must be false so cookies work across preview proxies and http/https environments
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSessionUser(): Promise<{ userId: number; username: string } | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;
  try {
    const decoded = Buffer.from(cookie.value, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed.userId && parsed.username) {
      return { userId: parsed.userId, username: parsed.username };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
