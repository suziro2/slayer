import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, gameProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSessionUser } from "@/lib/session";
import { DEFAULT_INVENTORY_ITEMS } from "@/lib/gameData";
import { ensureSchema } from "@/db/ensureSchema";
import { isDatabaseConfigured } from "@/db";

export async function POST(req: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Set the DATABASE_URL environment variable and redeploy.",
        },
        { status: 503 }
      );
    }
    await ensureSchema();
    const { username, password } = await req.json();

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 5) {
      return NextResponse.json(
        { error: "Password must be at least 5 characters long." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: cleanUsername,
        passwordHash,
      })
      .returning();

    // Initialize game progress
    const [progress] = await db
      .insert(gameProgress)
      .values({
        userId: newUser.id,
        level: 1,
        xp: 0,
        coins: 600,
        healthPotions: 5,
        selectedHeroId: "aiden",
        highestChapterUnlocked: 1,
        highestLevelUnlocked: 1,
        completedLevels: [],
        unlockedHeroes: ["aiden", "luna"],
        heroLevels: {
          aiden: 1,
          luna: 1,
          ronan: 1,
          mira: 1,
          kael: 1,
          bruno: 1,
          sylvie: 1,
          darius: 1,
          elian: 1,
          riven: 1,
        },
        statUpgrades: {
          attackLevel: 1,
          healthLevel: 1,
          defenseLevel: 1,
          skillLevel: 1,
        },
        inventory: DEFAULT_INVENTORY_ITEMS,
        settings: {
          musicVolume: 70,
          sfxVolume: 80,
          autoTarget: true,
          screenShake: true,
          damageNumbers: true,
        },
      })
      .returning();

    await setSessionUser(newUser.id, newUser.username);

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, username: newUser.username },
      progress,
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
