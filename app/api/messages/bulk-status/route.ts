import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const BULK_LIMIT = 180;

/** Returns how many bulk-direct messages have been sent today for this org */
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure the columns exist (idempotent)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Settings"
    ADD COLUMN IF NOT EXISTS "bulkSentToday" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "bulkSentDate"  TEXT    NOT NULL DEFAULT ''
  `).catch(() => {});

  const rows = await prisma.$queryRaw<{ bulkSentToday: number; bulkSentDate: string }[]>`
    SELECT "bulkSentToday", "bulkSentDate" FROM "Settings" WHERE id = 'singleton' LIMIT 1
  `.catch(() => []);

  const today = new Date().toISOString().slice(0, 10);
  const sentToday = rows[0]?.bulkSentDate === today ? (rows[0]?.bulkSentToday ?? 0) : 0;

  return NextResponse.json({ sentToday, remaining: Math.max(0, BULK_LIMIT - sentToday), limit: BULK_LIMIT });
}
