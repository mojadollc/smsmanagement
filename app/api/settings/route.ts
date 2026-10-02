import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  twilioAccountSid: "",
  twilioAuthToken: "",
  twilioMessagingServiceSid: "",
  dailyLimit: 200,
  appUrl: "",
  timezone: "UTC",
  sendingMethods: { immediate: true, batch: true },
};

export async function GET() {
  try {
    // Use $queryRaw so we get all columns even if Prisma client is stale
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM "Settings" WHERE id = 'singleton' LIMIT 1
    `;

    if (rows.length === 0) {
      // Row doesn't exist yet — create it with defaults via raw SQL
      await prisma.$executeRaw`
        INSERT INTO "Settings" (id, "twilioAccountSid", "twilioAuthToken", "twilioMessagingServiceSid",
          "dailyLimit", "appUrl", timezone, "sendingMethods", "updatedAt")
        VALUES ('singleton', '', '', '', 200, '', 'UTC', '{"immediate":true,"batch":true}'::jsonb, NOW())
        ON CONFLICT (id) DO NOTHING
      `;
      return NextResponse.json({ ...DEFAULTS });
    }

    const row = rows[0];
    let sendingMethods = DEFAULTS.sendingMethods;
    if (row.sendingMethods) {
      try {
        sendingMethods = typeof row.sendingMethods === "string"
          ? JSON.parse(row.sendingMethods)
          : row.sendingMethods as typeof sendingMethods;
      } catch { /* keep defaults */ }
    }

    return NextResponse.json({
      ...row,
      twilioAuthToken: row.twilioAuthToken ? "••••••••••••••••••••••••••••••••" : "",
      sendingMethods,
    });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json(DEFAULTS, { status: 200 }); // never 500 the client
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.twilioAuthToken?.startsWith("•")) {
      delete body.twilioAuthToken;
    }

    const sendingMethods = body.sendingMethods
      ? JSON.stringify(body.sendingMethods)
      : JSON.stringify(DEFAULTS.sendingMethods);

    // Build update fields dynamically so we only touch what's sent
    await prisma.$executeRaw`
      INSERT INTO "Settings" (id, "twilioAccountSid", "twilioAuthToken", "twilioMessagingServiceSid",
        "dailyLimit", "appUrl", timezone, "sendingMethods", "updatedAt")
      VALUES (
        'singleton',
        ${body.twilioAccountSid ?? ""},
        ${body.twilioAuthToken ?? ""},
        ${body.twilioMessagingServiceSid ?? ""},
        ${body.dailyLimit ?? 200},
        ${body.appUrl ?? ""},
        ${body.timezone ?? "UTC"},
        ${sendingMethods}::jsonb,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        "twilioAccountSid"          = EXCLUDED."twilioAccountSid",
        "twilioAuthToken"           = CASE WHEN ${body.twilioAuthToken ?? ""} = '' THEN "Settings"."twilioAuthToken" ELSE EXCLUDED."twilioAuthToken" END,
        "twilioMessagingServiceSid" = EXCLUDED."twilioMessagingServiceSid",
        "dailyLimit"                = EXCLUDED."dailyLimit",
        "appUrl"                    = EXCLUDED."appUrl",
        timezone                    = EXCLUDED.timezone,
        "sendingMethods"            = EXCLUDED."sendingMethods",
        "updatedAt"                 = NOW()
    `;

    const rows = await prisma.$queryRaw<{ updatedAt: Date }[]>`
      SELECT "updatedAt" FROM "Settings" WHERE id = 'singleton'
    `;

    return NextResponse.json({ success: true, updatedAt: rows[0]?.updatedAt });
  } catch (err) {
    console.error("[settings POST]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
