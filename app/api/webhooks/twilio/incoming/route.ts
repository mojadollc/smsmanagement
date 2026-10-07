import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_AGENT_EMAIL = "hearbet1@gmail.com";

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

  const phoneNumber = await prisma.twilioPhoneNumber.findUnique({ where: { phoneNumber: to } });

  // Find default agent to assign all conversations to
  const defaultAgent = await prisma.user.findFirst({ where: { email: DEFAULT_AGENT_EMAIL, active: true } });

  // Find or create customer
  let customer = await prisma.customer.findFirst({ where: { phone: from } });
  let orgId: string = "default-org";
  if (customer) {
    orgId = customer.orgId;
  } else if (phoneNumber) {
    const conv = await prisma.conversation.findFirst({ where: { phoneNumberId: phoneNumber.id }, select: { orgId: true } });
    if (conv?.orgId) orgId = conv.orgId;
  }

  if (!customer) {
    customer = await prisma.customer.create({
      data: { orgId, firstName: "Unknown", lastName: from, phone: from },
    });
  }

  // Always find the SINGLE existing conversation for this customer — never create duplicates
  // Pick the one with the most recent activity if multiple exist
  const conversations = await prisma.conversation.findMany({
    where: { customerId: customer.id },
    orderBy: { lastMessageAt: "desc" },
  });

  let conversation = conversations[0] ?? null;

  // Merge any duplicate conversations into the most recent one
  if (conversations.length > 1) {
    const keepId = conversations[0].id;
    const duplicateIds = conversations.slice(1).map(c => c.id);
    await prisma.message.updateMany({
      where: { conversationId: { in: duplicateIds } },
      data: { conversationId: keepId },
    });
    await prisma.conversation.deleteMany({ where: { id: { in: duplicateIds } } });
  }

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        orgId: customer.orgId,
        customerId: customer.id,
        phoneNumberId: phoneNumber?.id,
        assignedUserId: defaultAgent?.id ?? null,
      },
    });
  } else if (!conversation.assignedUserId && defaultAgent) {
    // Assign unassigned conversations to default agent
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { assignedUserId: defaultAgent.id },
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
