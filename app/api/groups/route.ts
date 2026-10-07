import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.group.findMany({
    where: { orgId: user.orgId },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups.map(g => ({ ...g, memberCount: g._count.members })));
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const group = await prisma.group.create({
    data: { orgId: user.orgId, name, description },
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json({ ...group, memberCount: 0 }, { status: 201 });
}
