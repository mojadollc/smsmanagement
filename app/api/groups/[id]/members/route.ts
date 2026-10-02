import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const { customerIds } = await req.json();

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    return NextResponse.json({ error: "customerIds array required" }, { status: 400 });
  }

  const data = customerIds.map(customerId => ({ groupId, customerId }));
  
  await prisma.groupMember.createMany({
    data,
    skipDuplicates: true,
  });

  const count = await prisma.groupMember.count({ where: { groupId } });
  return NextResponse.json({ success: true, memberCount: count });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }

  await prisma.groupMember.delete({
    where: { groupId_customerId: { groupId, customerId } },
  });

  const count = await prisma.groupMember.count({ where: { groupId } });
  return NextResponse.json({ success: true, memberCount: count });
}
