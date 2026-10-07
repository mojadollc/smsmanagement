import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = params;

  console.log("[status webhook]", { MessageSid, MessageStatus });

  if (!MessageSid || !MessageStatus) return NextResponse.json({ ok: true });

  const message = await prisma.message.findUnique({ where: { twilioSid: MessageSid } });
  if (!message) return NextResponse.json({ ok: true });

  await prisma.deliveryEvent.create({
    data: { messageId: message.id, status: MessageStatus, rawData: params },
  }).catch(() => {});

  const updateData: Record<string, unknown> = { status: MessageStatus };
  if (ErrorCode) updateData.errorCode = ErrorCode;
  if (ErrorMessage) updateData.errorMessage = ErrorMessage;
  if (MessageStatus === "delivered") updateData.deliveredAt = new Date();
  if (MessageStatus === "sent") updateData.sentAt = new Date();

  await prisma.message.update({ where: { id: message.id }, data: updateData });

  if (message.direction === "outbound") {
    const queueItem = await prisma.smsQueue.findFirst({ where: { twilioSid: MessageSid } });
    if (queueItem?.campaignId) {
      if (MessageStatus === "delivered") {
        await prisma.campaign.update({ where: { id: queueItem.campaignId }, data: { delivered: { increment: 1 } } });
        await prisma.campaignRecipient.updateMany({
          where: { campaignId: queueItem.campaignId, customerId: queueItem.customerId },
          data: { status: "delivered" },
        });
        await prisma.smsQueue.update({ where: { id: queueItem.id }, data: { status: "delivered" } });
      } else if (MessageStatus === "failed" || MessageStatus === "undelivered") {
        await prisma.campaign.update({ where: { id: queueItem.campaignId }, data: { failed: { increment: 1 } } });
        await prisma.campaignRecipient.updateMany({
          where: { campaignId: queueItem.campaignId, customerId: queueItem.customerId },
          data: { status: "failed" },
        });
        await prisma.smsQueue.update({ where: { id: queueItem.id }, data: { status: "failed" } });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
