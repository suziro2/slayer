import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gameProgress = pgTable("game_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  coins: integer("coins").default(500).notNull(),
  healthPotions: integer("health_potions").default(5).notNull(),
  selectedHeroId: text("selected_hero_id").default("aiden").notNull(),
  highestChapterUnlocked: integer("highest_chapter_unlocked").default(1).notNull(),
  highestLevelUnlocked: integer("highest_level_unlocked").default(1).notNull(), // Chapter 1, level 1
  completedLevels: jsonb("completed_levels").$type<string[]>().default(["0-0"]).notNull(), // array of "ch-lvl" completed
  unlockedHeroes: jsonb("unlocked_heroes").$type<string[]>().default(["aiden", "luna"]).notNull(),
  heroLevels: jsonb("hero_levels").$type<Record<string, number>>().default({
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
  }).notNull(),
  statUpgrades: jsonb("stat_upgrades").$type<{
    attackLevel: number;
    healthLevel: number;
    defenseLevel: number;
    skillLevel: number;
  }>().default({
    attackLevel: 1,
    healthLevel: 1,
    defenseLevel: 1,
    skillLevel: 1,
  }).notNull(),
  inventory: jsonb("inventory").$type<Array<{
    id: string;
    itemId: string;
    name: string;
    type: "weapon" | "armor" | "accessory" | "material";
    rarity: "common" | "rare" | "epic" | "legendary";
    atkBonus: number;
    hpBonus: number;
    defBonus: number;
    critBonus: number;
    equipped: boolean;
    description: string;
  }>>().default([]).notNull(),
  settings: jsonb("settings").$type<{
    musicVolume: number;
    sfxVolume: number;
    autoTarget: boolean;
    screenShake: boolean;
    damageNumbers: boolean;
  }>().default({
    musicVolume: 80,
    sfxVolume: 80,
    autoTarget: true,
    screenShake: true,
    damageNumbers: true,
  }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type GameProgress = typeof gameProgress.$inferSelect;
