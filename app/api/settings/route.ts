import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  // Never expose auth token to client — mask it
  return NextResponse.json({
    ...settings,
    twilioAuthToken: settings.twilioAuthToken ? "••••••••••••••••••••••••••••••••" : "",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Don't overwrite auth token if the masked placeholder is sent back
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
