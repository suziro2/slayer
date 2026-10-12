import { pool, isDatabaseConfigured } from "./index";

/**
 * Idempotent runtime schema bootstrap.
 *
 * The preview sandbox can start with an empty PostgreSQL database, so before any
 * auth/save query runs we make sure both tables exist. This mirrors
 * `src/db/schema.ts` exactly and is safe to call repeatedly (CREATE TABLE IF NOT EXISTS).
 * `npx drizzle-kit push` remains the canonical way to apply schema changes.
 */
const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS game_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 500,
  health_potions INTEGER NOT NULL DEFAULT 5,
  selected_hero_id TEXT NOT NULL DEFAULT 'aiden',
  highest_chapter_unlocked INTEGER NOT NULL DEFAULT 1,
  highest_level_unlocked INTEGER NOT NULL DEFAULT 1,
  completed_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  unlocked_heroes JSONB NOT NULL DEFAULT '["aiden","luna"]'::jsonb,
  hero_levels JSONB NOT NULL DEFAULT '{"aiden":1,"luna":1,"ronan":1,"mira":1,"kael":1,"bruno":1,"sylvie":1,"darius":1,"elian":1,"riven":1}'::jsonb,
  stat_upgrades JSONB NOT NULL DEFAULT '{"attackLevel":1,"healthLevel":1,"defenseLevel":1,"skillLevel":1}'::jsonb,
  inventory JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{"musicVolume":70,"sfxVolume":80,"autoTarget":true,"screenShake":true,"damageNumbers":true}'::jsonb,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
`;

let cached: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  // No database configured (e.g. DATABASE_URL missing on Vercel): skip the
  // bootstrap query. API routes report this state explicitly instead.
  if (!isDatabaseConfigured()) {
    return Promise.resolve();
  }
  if (!cached) {
    cached = (async () => {
      try {
        await pool.query(SQL);
      } catch (err) {
        // Never crash the request path because of a bootstrap hiccup; reset so the
        // next request retries.
        cached = null;
        console.error("[ensureSchema] failed:", err);
      }
    })();
  }
  return cached;
}
