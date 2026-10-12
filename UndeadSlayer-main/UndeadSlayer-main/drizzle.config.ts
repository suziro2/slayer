import { defineConfig } from "drizzle-kit";

/**
 * Reads DATABASE_URL from the environment with a local-dev fallback, so
 * `drizzle-kit push` / `generate` / `check` work both locally and on Vercel
 * without editing config files per environment.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
