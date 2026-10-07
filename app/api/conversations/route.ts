import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const all = searchParams.get("all") === "true" && user.role === "admin";

  const where = {
    orgId: user.orgId,
    ...(all ? {} : { assignedUserId: user.id }),
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, body: true, createdAt: true, direction: true, status: true, fromNumber: true } },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
    prisma.conversation.count({ where }),
  ]);

  return NextResponse.json({ conversations, total, page, limit });
}
