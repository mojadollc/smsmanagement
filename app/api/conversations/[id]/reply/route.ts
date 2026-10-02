import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { message } = await req.json();

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conversation.customer.smsOptOut) {
    return NextResponse.json({ error: "Customer opted out" }, { status: 400 });
  }

  const result = await sendSMS(conversation.customer.phone, message);

  const msg = await prisma.message.create({
    data: {
      conversationId: id,
      customerId: conversation.customerId,
      direction: "outbound",
      body: message,
      twilioSid: result.sid,
      status: "queued",
      fromNumber: result.from ?? "",
      toNumber: conversation.customer.phone,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json(msg, { status: 201 });
}
