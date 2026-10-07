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

  // Process jobs in parallel, in chunks of 10
  const chunkSize = 10;
  for (let i = 0; i < jobs.length; i += chunkSize) {
    await Promise.all(jobs.slice(i, i + chunkSize).map(processJob));
  }
}

async function processJob(job: { id: string; customerId: string; phone: string; message: string; campaignId: string | null; customer: { smsOptOut: boolean } }) {
  if (job.customer.smsOptOut) {
    await prisma.smsQueue.update({
      where: { id: job.id },
      data: { status: "skipped" },
    });
    return;
  }

  await prisma.smsQueue.update({
    where: { id: job.id },
    data: { status: "sending", attempts: { increment: 1 } },
  });

  try {
    const result = await sendSMS(job.phone, job.message);

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
      await prisma.campaignRecipient.updateMany({
        where: { campaignId: job.campaignId, customerId: job.customerId },
        data: { status: "sent" },
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
      await prisma.campaignRecipient.updateMany({
        where: { campaignId: job.campaignId, customerId: job.customerId },
        data: { status: "failed" },
      });
    }
  }
}
