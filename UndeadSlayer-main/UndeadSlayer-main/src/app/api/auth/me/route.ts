import { NextResponse } from "next/server";
import { getSessionUser, clearSession } from "@/lib/session";
import { db } from "@/db";
import { gameProgress, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSchema } from "@/db/ensureSchema";
import { isDatabaseConfigured } from "@/db";

const DB_MISSING_RESPONSE = {
  error:
    "Database is not configured. Set the DATABASE_URL environment variable and redeploy.",
};

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(DB_MISSING_RESPONSE, { status: 503 });
    }
    await ensureSchema();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const [user] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      await clearSession();
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const [progress] = await db
      .select()
      .from(gameProgress)
      .where(eq(gameProgress.userId, user.id))
      .limit(1);

    return NextResponse.json({
      authenticated: true,
      user,
      progress,
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
