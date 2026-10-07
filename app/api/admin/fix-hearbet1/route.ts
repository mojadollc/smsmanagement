import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TARGET_PHONES = ["+14073954525", "+18774544182", "+16043604433"];

export async function GET() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: { contains: "hearbet1" } }, { name: { contains: "hearbet1" } }] },
  });

  if (!user) {
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({ error: "hearbet1 user not found", allUsers });
  }

  const customers = await prisma.customer.findMany({
    where: { phone: { in: TARGET_PHONES } },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });

  const customerIds = customers.map((c) => c.id);

  const conversations = await prisma.conversation.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true, customerId: true, assignedUserId: true },
  });

  let updated = 0;
  if (conversations.length > 0) {
    const result = await prisma.conversation.updateMany({
      where: { id: { in: conversations.map((c) => c.id) } },
      data: { assignedUserId: user.id },
    });
    updated = result.count;
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    customers,
    conversations,
    updatedConversations: updated,
  });
}
