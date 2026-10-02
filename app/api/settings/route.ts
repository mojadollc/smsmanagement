import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  const s = settings as typeof settings & { sendingMethods?: Record<string, boolean> | null };
  return NextResponse.json({
    ...settings,
    twilioAuthToken: settings.twilioAuthToken ? "••••••••••••••••••••••••••••••••" : "",
    sendingMethods: s.sendingMethods ?? { immediate: true, batch: true },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.twilioAuthToken?.startsWith("•")) {
    delete body.twilioAuthToken;
  }

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: body,
    create: { id: "singleton", ...body },
  });

  return NextResponse.json({ success: true, updatedAt: settings.updatedAt });
}
