import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TARGET_PHONES = ["+14073954525", "+18774544182", "+16043604433"];
const USER_ID = "cmuy40djy0009tgnxfwldin5c";
// Canonical customer IDs (keep these, delete duplicates)
const KEEP = {
  "+16043604433": "cmuyastp6002etgnx4zt0k278", // kush b
  "+18774544182": "cmuya4zq6001otgnx4hdiopnr",
  "+14073954525": "cmuydyjzd0000uinx5llywckj",
};
// Duplicate customer to remove for +16043604433
const DUPE_ID = "cmuqsl0ap0006g0nxjsltrtoj";

export async function GET() {
  const log: string[] = [];

  // 1. Re-assign conversation of duplicate customer to canonical customer
  const dupeConvs = await prisma.conversation.findMany({
    where: { customerId: DUPE_ID },
    select: { id: true },
  });
  if (dupeConvs.length > 0) {
    await prisma.message.updateMany({
      where: { customerId: DUPE_ID },
      data: { customerId: KEEP["+16043604433"] },
    });
    await prisma.conversation.updateMany({
      where: { customerId: DUPE_ID },
      data: { customerId: KEEP["+16043604433"], assignedUserId: USER_ID },
    });
    log.push(`Moved ${dupeConvs.length} conversation(s) from duplicate customer ${DUPE_ID} to ${KEEP["+16043604433"]}`);
  }

  // 2. Delete duplicate customer (after moving relations)
  try {
    await prisma.smsQueue.deleteMany({ where: { customerId: DUPE_ID } });
    await prisma.campaignRecipient.deleteMany({ where: { customerId: DUPE_ID } });
    await prisma.optInRecord.deleteMany({ where: { customerId: DUPE_ID } });
    await prisma.groupMember.deleteMany({ where: { customerId: DUPE_ID } });
    await prisma.customer.delete({ where: { id: DUPE_ID } });
    log.push(`Deleted duplicate customer ${DUPE_ID}`);
  } catch (e: unknown) {
    log.push(`Could not delete duplicate: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Ensure all canonical customers have a conversation assigned to hearbet1
  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) return NextResponse.json({ error: "User not found" });

  for (const [phone, customerId] of Object.entries(KEEP)) {
    const existing = await prisma.conversation.findFirst({ where: { customerId } });
    if (existing) {
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { assignedUserId: USER_ID },
      });
      log.push(`Assigned existing conversation ${existing.id} (${phone}) to hearbet1`);
    } else {
      // Create missing conversation
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        const conv = await prisma.conversation.create({
          data: {
            orgId: customer.orgId,
            customerId,
            assignedUserId: USER_ID,
            status: "open",
          },
        });
        log.push(`Created new conversation ${conv.id} for ${phone}`);
      }
    }
  }

  // 4. Final state
  const finalConvs = await prisma.conversation.findMany({
    where: { customerId: { in: Object.values(KEEP) } },
    select: { id: true, customerId: true, assignedUserId: true, status: true },
  });

  return NextResponse.json({ log, finalConversations: finalConvs });
}
