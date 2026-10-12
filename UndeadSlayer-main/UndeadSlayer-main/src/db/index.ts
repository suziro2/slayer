import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Build-safe database client.
 *
 * IMPORTANT: this module must NEVER throw at import time. `next build` imports
 * every API route to collect page data, and on Vercel `DATABASE_URL` is often
 * only present at runtime (or missing entirely if the env var was never added
 * in the Vercel dashboard). Throwing here fails the entire Production build.
 *
 * When `DATABASE_URL` is absent we fall back to a placeholder connection string
 * so the build succeeds; any real query will fail at request time, and API
 * routes + /api/health translate that into a clear "database unconfigured"
 * response via `isDatabaseConfigured()` instead of a cryptic crash.
 */
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://localhost:5432/undead-slayer-build-placeholder";

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }
  const pool = new Pool({ connectionString });
  // Cache on globalThis in every env so Vercel serverless functions reuse
  // connections instead of exhausting the Postgres connection limit.
  globalForDb.__arenaNextJsPostgresqlPool = pool;
  return pool;
}

export const pool = createPool();

export const db = drizzle(pool);
