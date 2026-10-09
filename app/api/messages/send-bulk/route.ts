import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { requireAuth } from "@/lib/auth";

const BULK_LIMIT = 180;

function normalizePhone(raw: string): string {
  // Strip everything except digits and leading +
  const cleaned = raw.trim().replace(/[^\d+]/g, "");
  // If no leading +, assume US (+1) if 10 digits, else prepend +
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) return `+1${cleaned}`;
    if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
    return `+${cleaned}`;
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phones, message } = await req.json() as { phones: string[]; message: string };

  if (!Array.isArray(phones) || phones.length === 0)
    return NextResponse.json({ error: "No phone numbers provided" }, { status: 400 });
  if (!message?.trim())
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

  // Ensure columns exist
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Settings"
    ADD COLUMN IF NOT EXISTS "bulkSentToday" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "bulkSentDate"  TEXT    NOT NULL DEFAULT ''
  `).catch(() => {});

  // Read current daily count
  const rows = await prisma.$queryRaw<{ bulkSentToday: number; bulkSentDate: string }[]>`
    SELECT "bulkSentToday", "bulkSentDate" FROM "Settings" WHERE id = 'singleton' LIMIT 1
  `.catch(() => []);

  const today = new Date().toISOString().slice(0, 10);
  const alreadySent = rows[0]?.bulkSentDate === today ? (rows[0]?.bulkSentToday ?? 0) : 0;
  const remaining = Math.max(0, BULK_LIMIT - alreadySent);

  if (remaining === 0)
    return NextResponse.json({ error: "Daily bulk limit of 180 reached. Resets tomorrow." }, { status: 429 });

  // Clamp to remaining
  const toSend = phones.slice(0, remaining);

  type ResultItem = { phone: string; status: "sent" | "failed" | "opted_out" | "invalid"; error?: string };
  const results: ResultItem[] = [];
  let successCount = 0;

  for (const rawPhone of toSend) {
    const phone = normalizePhone(rawPhone);

    if (phone.length < 8) {
      results.push({ phone: rawPhone, status: "invalid", error: "Invalid phone number" });
      continue;
    }

    try {
      // Find or auto-create customer
      let customer = await prisma.customer.findFirst({
        where: { orgId: user.orgId, phone },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            orgId: user.orgId,
            firstName: "Unknown",
            lastName: phone,
            phone,
          },
        });
      }

      if (customer.smsOptOut) {
        results.push({ phone, status: "opted_out", error: "Customer opted out" });
        continue;
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { customerId: customer.id, orgId: user.orgId },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { customerId: customer.id, orgId: user.orgId, assignedUserId: user.id },
        });
      } else if (!conversation.assignedUserId) {
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: { assignedUserId: user.id },
        });
      }

      const result = await sendSMS(phone, message);

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          customerId: customer.id,
          direction: "outbound",
          body: message,
          twilioSid: result.sid,
          status: "queued",
          fromNumber: result.from ?? "",
          toNumber: phone,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      results.push({ phone, status: "sent" });
      successCount++;
    } catch (err: any) {
      results.push({ phone, status: "failed", error: err?.message ?? "Send failed" });
    }
  }

  // Update daily counter
  const newCount = alreadySent + successCount;
  await prisma.$executeRawUnsafe(
    `UPDATE "Settings" SET "bulkSentToday" = $1, "bulkSentDate" = $2 WHERE id = 'singleton'`,
    newCount,
    today
  ).catch(() => {});

  // Mark phones beyond the limit as not sent
  if (phones.length > remaining) {
    for (const rawPhone of phones.slice(remaining)) {
      results.push({ phone: normalizePhone(rawPhone), status: "failed", error: "Daily limit reached" });
    }
  }

  return NextResponse.json({
    results,
    sentCount: successCount,
    remaining: Math.max(0, BULK_LIMIT - newCount),
    limitReached: newCount >= BULK_LIMIT,
  });
}
