import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const PHONE = "+14073954525";

  // Find ALL messages involving this phone number regardless of conversation
  const allMessages = await prisma.message.findMany({
    where: {
      OR: [
        { fromNumber: PHONE },
        { toNumber: PHONE },
      ],
    },
    select: {
      id: true,
      conversationId: true,
      customerId: true,
      direction: true,
      body: true,
      fromNumber: true,
      toNumber: true,
      status: true,
      createdAt: true,
      sentAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Also check sms_queue for any sent messages to this number
  const queueItems = await prisma.smsQueue.findMany({
    where: { phone: PHONE },
    select: { id: true, phone: true, message: true, status: true, scheduledAt: true, createdAt: true, twilioSid: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ allMessages, queueItems, totalMessages: allMessages.length });
}
