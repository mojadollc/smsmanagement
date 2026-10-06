import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateWebhook } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  // Use the actual request URL for signature validation — avoids env var mismatch
  const url = req.url;
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  if (signature && !await validateWebhook(signature, url, params)) {
    // Try with configured app URL as fallback
    const configuredUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`;
    if (!await validateWebhook(signature, configuredUrl, params)) {
      console.error("[status webhook] signature validation failed", { url, configuredUrl });
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = params;

  const message = await prisma.message.findUnique({ where: { twilioSid: MessageSid } });
  if (!message) return NextResponse.json({ ok: true });

  await prisma.deliveryEvent.create({
    data: { messageId: message.id, status: MessageStatus, rawData: params },
  });

  const updateData: Record<string, unknown> = { status: MessageStatus };
  if (ErrorCode) updateData.errorCode = ErrorCode;
  if (ErrorMessage) updateData.errorMessage = ErrorMessage;
  if (MessageStatus === "delivered") updateData.deliveredAt = new Date();
  if (MessageStatus === "sent") updateData.sentAt = new Date();

  await prisma.message.update({ where: { id: message.id }, data: updateData });

  // Update campaign counters
  if (message.direction === "outbound") {
    const queueItem = await prisma.smsQueue.findFirst({ where: { twilioSid: MessageSid } });
    if (queueItem?.campaignId && MessageStatus === "delivered") {
      await prisma.campaign.update({
        where: { id: queueItem.campaignId },
        data: { delivered: { increment: 1 } },
      });
    }
    if (queueItem?.campaignId && (MessageStatus === "failed" || MessageStatus === "undelivered")) {
      await prisma.campaign.update({
        where: { id: queueItem.campaignId },
        data: { failed: { increment: 1 } },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
