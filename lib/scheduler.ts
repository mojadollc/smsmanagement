import { prisma } from "./prisma";
import { enqueueSMS } from "./queue";

interface ScheduleSlot {
  time: string; // "HH:MM"
  count: number;
}

export async function scheduleCampaign(
  campaignId: string,
  schedules: ScheduleSlot[],
  date: Date = new Date()
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      recipients: {
        include: { customer: true },
        where: { status: "pending" },
      },
    },
  });

  if (!campaign) throw new Error("Campaign not found");

  const recipients = campaign.recipients;
  let recipientIndex = 0;

  const updates: Promise<unknown>[] = [];

  for (const slot of schedules) {
    const [hours, minutes] = slot.time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const batch = recipients.slice(recipientIndex, recipientIndex + slot.count);
    recipientIndex += slot.count;

    for (const recipient of batch) {
      if (recipient.customer.smsOptOut) {
        updates.push(
          prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "opted_out" },
          }),
          prisma.campaign.update({
            where: { id: campaignId },
            data: { optedOut: { increment: 1 }, pending: { decrement: 1 } },
          })
        );
        continue;
      }

      const message = campaign.message.replace(
        /\{\{first_name\}\}/g,
        recipient.customer.firstName
      );

      updates.push(
        enqueueSMS({
          customerId: recipient.customer.id,
          phone: recipient.customer.phone,
          message,
          scheduledAt,
          campaignId,
        }),
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "queued" },
        })
      );
    }
  }

  // Execute all DB writes in parallel, in chunks of 20 to avoid overwhelming the connection pool
  const chunkSize = 20;
  for (let i = 0; i < updates.length; i += chunkSize) {
    await Promise.all(updates.slice(i, i + chunkSize));
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "scheduled" },
  });
}
