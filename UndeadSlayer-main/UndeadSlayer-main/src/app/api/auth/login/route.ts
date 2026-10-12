import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users, gameProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSessionUser } from "@/lib/session";
import { ensureSchema } from "@/db/ensureSchema";

export async function POST(req: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Set the DATABASE_URL environment variable in Vercel and redeploy.",
        },
        { status: 503 }
      );
    }

    await ensureSchema();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Please enter both username and password." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Fetch user progress
    let [progress] = await db
      .select()
      .from(gameProgress)
      .where(eq(gameProgress.userId, user.id))
      .limit(1);

    if (!progress) {
      // Re-seed if missing
      [progress] = await db
        .insert(gameProgress)
        .values({
          userId: user.id,
          level: 1,
          xp: 0,
          coins: 500,
          healthPotions: 5,
          selectedHeroId: "aiden",
          highestChapterUnlocked: 1,
          highestLevelUnlocked: 1,
          completedLevels: [],
          unlockedHeroes: ["aiden", "luna"],
          heroLevels: { aiden: 1, luna: 1, ronan: 1, mira: 1, kael: 1, bruno: 1, sylvie: 1, darius: 1, elian: 1, riven: 1 },
          statUpgrades: { attackLevel: 1, healthLevel: 1, defenseLevel: 1, skillLevel: 1 },
          inventory: [],
          settings: { musicVolume: 70, sfxVolume: 80, autoTarget: true, screenShake: true, damageNumbers: true },
        })
        .returning();
    }

    await setSessionUser(user.id, user.username);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
      progress,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err.message || "An error occurred during login." },
      { status: 500 }
    );
  }
}
