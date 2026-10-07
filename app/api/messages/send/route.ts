import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId, message } = await req.json();
  if (!customerId || !message)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const customer = await prisma.customer.findFirst({ where: { id: customerId, orgId: user.orgId } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  if (customer.smsOptOut) return NextResponse.json({ error: "Customer opted out" }, { status: 400 });

  let conversation = await prisma.conversation.findFirst({ where: { customerId, orgId: user.orgId } });
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { customerId, orgId: user.orgId } });
  }

  const result = await sendSMS(customer.phone, message);

  const msg = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      customerId,
      direction: "outbound",
      body: message,
      twilioSid: result.sid,
      status: "queued",
      fromNumber: result.from ?? "",
      toNumber: customer.phone,
    },
  });

  await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
  return NextResponse.json(msg, { status: 201 });
}
