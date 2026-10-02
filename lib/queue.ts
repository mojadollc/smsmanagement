import { prisma } from "./prisma";
import { sendSMS } from "./twilio";

export async function enqueueSMS({
  customerId,
  phone,
  message,
  scheduledAt,
  campaignId,
}: {
  customerId: string;
  phone: string;
  message: string;
  scheduledAt: Date;
  campaignId?: string;
}) {
  return prisma.smsQueue.create({
    data: { customerId, phone, message, scheduledAt, campaignId },
  });
}

export async function processDueJobs() {
  const jobs = await prisma.smsQueue.findMany({
    where: { status: "pending", scheduledAt: { lte: new Date() } },
    include: { customer: true },
    take: 50,
    orderBy: { scheduledAt: "asc" },
  });

  for (const job of jobs) {
    if (job.customer.smsOptOut) {
      await prisma.smsQueue.update({
        where: { id: job.id },
        data: { status: "skipped" },
      });
      continue;
    }

    await prisma.smsQueue.update({
      where: { id: job.id },
      data: { status: "sending", attempts: { increment: 1 } },
    });

    try {
      const result = await sendSMS(job.phone, job.message);

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { customerId: job.customerId },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { customerId: job.customerId },
        });
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          customerId: job.customerId,
          direction: "outbound",
          body: job.message,
          twilioSid: result.sid,
          status: "queued",
          fromNumber: result.from ?? "",
          toNumber: job.phone,
        },
      });

      await prisma.smsQueue.update({
        where: { id: job.id },
        data: { status: "sent", twilioSid: result.sid },
      });

      if (job.campaignId) {
        await prisma.campaign.update({
          where: { id: job.campaignId },
          data: { sent: { increment: 1 }, pending: { decrement: 1 } },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await prisma.smsQueue.update({
        where: { id: job.id },
        data: { status: "failed", lastError: msg },
      });
      if (job.campaignId) {
        await prisma.campaign.update({
          where: { id: job.campaignId },
          data: { failed: { increment: 1 }, pending: { decrement: 1 } },
        });
      }
    }
  }
}
