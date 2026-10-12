import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { db } from "@/db";
import { gameProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Whitelist updatable fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (payload.level !== undefined) updateData.level = payload.level;
    if (payload.xp !== undefined) updateData.xp = payload.xp;
    if (payload.coins !== undefined) updateData.coins = payload.coins;
    if (payload.healthPotions !== undefined) updateData.healthPotions = payload.healthPotions;
    if (payload.selectedHeroId !== undefined) updateData.selectedHeroId = payload.selectedHeroId;
    if (payload.highestChapterUnlocked !== undefined) updateData.highestChapterUnlocked = payload.highestChapterUnlocked;
    if (payload.highestLevelUnlocked !== undefined) updateData.highestLevelUnlocked = payload.highestLevelUnlocked;
    if (payload.completedLevels !== undefined) updateData.completedLevels = payload.completedLevels;
    if (payload.unlockedHeroes !== undefined) updateData.unlockedHeroes = payload.unlockedHeroes;
    if (payload.heroLevels !== undefined) updateData.heroLevels = payload.heroLevels;
    if (payload.statUpgrades !== undefined) updateData.statUpgrades = payload.statUpgrades;
    if (payload.inventory !== undefined) updateData.inventory = payload.inventory;
    if (payload.settings !== undefined) updateData.settings = payload.settings;

    const [updated] = await db
      .update(gameProgress)
      .set(updateData)
      .where(eq(gameProgress.userId, session.userId))
      .returning();

    return NextResponse.json({ success: true, progress: updated });
  } catch (err: any) {
    console.error("Save progress error:", err);
    return NextResponse.json({ error: err.message || "Failed to update progress" }, { status: 500 });
  }
}
