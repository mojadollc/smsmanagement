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

  let recipientIndex = 0;
  const recipients = campaign.recipients;

  for (const slot of schedules) {
    const [hours, minutes] = slot.time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const batch = recipients.slice(recipientIndex, recipientIndex + slot.count);
    recipientIndex += slot.count;

    for (const recipient of batch) {
      if (recipient.customer.smsOptOut) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "opted_out" },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { optedOut: { increment: 1 }, pending: { decrement: 1 } },
        });
        continue;
      }

      const message = campaign.message.replace(
        /\{\{first_name\}\}/g,
        recipient.customer.firstName
      );

      await enqueueSMS({
        customerId: recipient.customer.id,
        phone: recipient.customer.phone,
        message,
        scheduledAt,
        campaignId,
      });

      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: "queued" },
      });
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "scheduled" },
  });
}
