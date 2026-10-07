import { prisma } from "./prisma";
import { enqueueSMS } from "./queue";

interface ScheduleSlot {
  time: string; // "HH:MM"
  count: number;
}

// Convert a "HH:MM" time string in US/Pacific (default) to a UTC Date for today
function toUTCDate(timeStr: string, baseDate: Date, timezone = "America/Vancouver"): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  // Build a date string in the target timezone using Intl
  const tzDate = new Date(baseDate);
  // Format: get today's date parts in the target TZ
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(tzDate);
  const y = parts.find(p => p.type === "year")!.value;
  const mo = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  // Construct ISO string in that timezone and parse to UTC
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  // Use the timezone offset by creating a date in that zone
  const localStr = `${y}-${mo}-${d}T${hh}:${mm}:00`;
  // Parse as if it's in the target timezone
  const utc = new Date(new Date(localStr).toLocaleString("en-US", { timeZone: "UTC" }));
  // Get offset between target TZ and UTC at that moment
  const targetOffset = getTimezoneOffset(timezone, new Date(localStr));
  return new Date(new Date(localStr).getTime() - targetOffset);
}

function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return utcDate.getTime() - tzDate.getTime();
}

export async function scheduleCampaign(
  campaignId: string,
  schedules: ScheduleSlot[],
  date: Date = new Date()
) {
  // Get timezone from settings (default America/Vancouver = US Pacific)
  const settingsRows = await prisma.$queryRaw<{ timezone: string }[]>`
    SELECT timezone FROM "Settings" WHERE id = 'singleton' LIMIT 1
  `.catch(() => []);
  const timezone = settingsRows[0]?.timezone || "America/Vancouver";

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
    const scheduledAt = toUTCDate(slot.time, date, timezone);
    // If the scheduled time is in the past, send immediately (within 30s)
    const now = new Date();
    const effectiveScheduledAt = scheduledAt < now ? new Date(now.getTime() + 5000) : scheduledAt;

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
          scheduledAt: effectiveScheduledAt,
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
