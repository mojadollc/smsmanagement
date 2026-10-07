import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  const from = params.From;
  const to = params.To;
  const messageBody = params.Body?.trim() ?? "";
  const optOutType = params.OptOutType;

  console.log("[incoming webhook]", { from, to, optOutType });

  if (!from) return new NextResponse("<?xml version='1.0'?><Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });

  // Handle opt-in/out keywords
  if (optOutType) {
    const customer = await prisma.customer.findFirst({ where: { phone: from } });
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

  // Find or create customer — use org from the receiving phone number if known
  const phoneNumber = await prisma.twilioPhoneNumber.findUnique({ where: { phoneNumber: to } });

  // Determine org: look for existing customer first, then fall back to phone number's org or default
  let customer = await prisma.customer.findFirst({ where: { phone: from } });
  const orgId = customer?.orgId ?? (
    phoneNumber
      ? await prisma.conversation.findFirst({ where: { phoneNumberId: phoneNumber.id }, select: { orgId: true } })
          .then(c => c?.orgId ?? "default-org")
      : "default-org"
  );

  if (!customer) {
    customer = await prisma.customer.create({
      data: { orgId, firstName: "Unknown", lastName: from, phone: from },
    });
  }

  let conversation = await prisma.conversation.findFirst({ where: { customerId: customer.id } });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { orgId: customer.orgId, customerId: customer.id, phoneNumberId: phoneNumber?.id },
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
    data: { unreadCount: { increment: 1 }, lastMessageAt: new Date(), status: "open" },
  });

  return new NextResponse("<?xml version='1.0'?><Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
