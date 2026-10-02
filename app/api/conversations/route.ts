import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
    prisma.conversation.count(),
  ]);

  return NextResponse.json({ conversations, total, page, limit });
}
