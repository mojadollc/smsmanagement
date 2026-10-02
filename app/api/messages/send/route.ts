import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const { customerId, message } = await req.json();

  if (!customerId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  if (customer.smsOptOut) return NextResponse.json({ error: "Customer opted out" }, { status: 400 });

  let conversation = await prisma.conversation.findFirst({
    where: { customerId },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { customerId } });
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

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json(msg, { status: 201 });
}
