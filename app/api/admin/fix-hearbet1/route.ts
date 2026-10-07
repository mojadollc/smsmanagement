import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const PHONE = "+14073954525";
  const USER_EMAIL = "hearbet1@gmail.com";

  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) return NextResponse.json({ error: "user not found" });

  // All customers with this phone
  const customers = await prisma.customer.findMany({
    where: { phone: PHONE },
    select: { id: true, firstName: true, lastName: true, phone: true, orgId: true },
  });

  const customerIds = customers.map((c) => c.id);

  // All conversations for those customers
  const conversations = await prisma.conversation.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true, customerId: true, assignedUserId: true, status: true, createdAt: true, lastMessageAt: true },
    orderBy: { createdAt: "asc" },
  });

  const convIds = conversations.map((c) => c.id);

  // All messages across all conversations
  const messages = await prisma.message.findMany({
    where: { conversationId: { in: convIds } },
    select: { id: true, conversationId: true, direction: true, body: true, fromNumber: true, toNumber: true, status: true, createdAt: true, sentAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ user: { id: user.id, email: user.email }, customers, conversations, messages });
}
