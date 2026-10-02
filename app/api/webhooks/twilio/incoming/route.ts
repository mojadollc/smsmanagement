import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateWebhook } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/incoming`;
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  if (!validateWebhook(signature, url, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = params.From;
  const to = params.To;
  const messageBody = params.Body?.trim() ?? "";
  const optOutType = params.OptOutType;

  // Handle opt-in/out keywords
  if (optOutType) {
    const customer = await prisma.customer.findUnique({ where: { phone: from } });
    if (customer) {
      if (optOutType === "STOP") {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { smsOptOut: true, smsOptOutAt: new Date(), smsOptIn: false },
        });
      } else if (optOutType === "START") {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { smsOptIn: true, smsOptInAt: new Date(), smsOptOut: false, smsOptOutAt: null },
        });
      }
      await prisma.optInRecord.create({
        data: { customerId: customer.id, type: optOutType, phone: from },
      });
    }
    return new NextResponse("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Find or create customer
  let customer = await prisma.customer.findUnique({ where: { phone: from } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { firstName: "Unknown", lastName: from, phone: from },
    });
  }

  // Find phone number record
  const phoneNumber = await prisma.twilioPhoneNumber.findUnique({ where: { phoneNumber: to } });

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { customerId: customer.id },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerId: customer.id,
        phoneNumberId: phoneNumber?.id,
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      customerId: customer.id,
      direction: "inbound",
      body: messageBody,
      twilioSid: params.MessageSid,
      status: "received",
      fromNumber: from,
      toNumber: to,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      unreadCount: { increment: 1 },
      lastMessageAt: new Date(),
      status: "open",
    },
  });

  return new NextResponse("<?xml version='1.0'?><Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
