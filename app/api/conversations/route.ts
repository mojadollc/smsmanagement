import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { orgId: user.orgId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, body: true, createdAt: true, direction: true, status: true } },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
    prisma.conversation.count({ where: { orgId: user.orgId } }),
  ]);

  return NextResponse.json({ conversations, total, page, limit });
}
