import { NextResponse } from "next/server";
import { isDatabaseConfigured, pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        database: "unconfigured",
        hint: "Set DATABASE_URL in Vercel Project Settings → Environment Variables, then redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    // Avoid returning credentials or raw driver errors to public clients.
    console.error("[health] Database connectivity check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        database: "unavailable",
        hint: "Check the Neon database status, connection string, SSL options, and Vercel function logs.",
      },
      { status: 503 }
    );
  }
}
