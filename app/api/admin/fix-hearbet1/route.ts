import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, orgId: true, role: true },
  });

  // Get all customers grouped by phone
  const customers = await prisma.customer.findMany({
    select: { id: true, firstName: true, lastName: true, phone: true, orgId: true },
    orderBy: { phone: "asc" },
  });

  // Get all conversations
  const conversations = await prisma.conversation.findMany({
    select: { id: true, customerId: true, assignedUserId: true, orgId: true, status: true, lastMessageAt: true },
    orderBy: { lastMessageAt: "asc" },
  });

  // Get message counts per conversation
  const msgCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    _count: { id: true },
  });

  // Find duplicate phones
  const phoneCounts: Record<string, typeof customers> = {};
  for (const c of customers) {
    if (!phoneCounts[c.phone]) phoneCounts[c.phone] = [];
    phoneCounts[c.phone].push(c);
  }
  const duplicates = Object.entries(phoneCounts).filter(([, arr]) => arr.length > 1);

  return NextResponse.json({ users, customers, conversations, msgCounts, duplicates: duplicates.map(([phone, arr]) => ({ phone, customers: arr })) });
}
