import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MERGES = [
  { keep: "cmux4d02q0000zmnxb80nhks5", drop: "cmuy345cb0002lznxrasaum7f" },   // +16047544733
  { keep: "cmuy1078n0000sxnx1xxw9gfy", drop: "cmuy34oac0003lznxd6etvkjh" },   // +18338403506
  { keep: "cmuqsgwq70002g0nxjn8rqwqe", drop: "cmuy3vuru0000tgnx4q0ez1kl" },   // +18777804236
  { keep: "cmuydyjzd0000uinx5llywckj", drop: "cmuy9u8rf000rtgnx6egq8o8i" },   // 14073954525 (no +)
];

const DEFAULT_ORG = "default-org";

async function mergeCustomer(keep: string, drop: string, log: string[]) {
  const dropConvs = await prisma.conversation.findMany({ where: { customerId: drop } });
  for (const conv of dropConvs) {
    const existing = await prisma.conversation.findFirst({ where: { customerId: keep } });
    if (existing) {
      await prisma.message.updateMany({
        where: { conversationId: conv.id },
        data: { conversationId: existing.id, customerId: keep },
      });
      const latest = await prisma.message.findFirst({
        where: { conversationId: existing.id },
        orderBy: { createdAt: "desc" },
      });
      if (latest) {
        await prisma.conversation.update({
          where: { id: existing.id },
          data: { lastMessageAt: latest.createdAt },
        });
      }
      await prisma.conversation.delete({ where: { id: conv.id } });
      log.push(`Merged conv ${conv.id} into ${existing.id}`);
    } else {
      await prisma.message.updateMany({ where: { conversationId: conv.id }, data: { customerId: keep } });
      await prisma.conversation.update({ where: { id: conv.id }, data: { customerId: keep } });
      log.push(`Moved conv ${conv.id} to customer ${keep}`);
    }
  }
  await prisma.message.updateMany({ where: { customerId: drop }, data: { customerId: keep } });
  await prisma.smsQueue.updateMany({ where: { customerId: drop }, data: { customerId: keep } });
  await prisma.campaignRecipient.deleteMany({ where: { customerId: drop } });
  await prisma.optInRecord.deleteMany({ where: { customerId: drop } });
  await prisma.groupMember.deleteMany({ where: { customerId: drop } });
  try {
    await prisma.customer.delete({ where: { id: drop } });
    log.push(`Deleted duplicate customer ${drop}`);
  } catch (e: unknown) {
    log.push(`Could not delete ${drop}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function GET() {
  const log: string[] = [];

  // 1. Merge all duplicate customers
  for (const { keep, drop } of MERGES) {
    await mergeCustomer(keep, drop, log);
  }

  // 2. Move ALL conversations to default-org, unassign so all agents share inbox
  const allConvs = await prisma.conversation.findMany({ select: { id: true } });
  for (const conv of allConvs) {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { orgId: DEFAULT_ORG, assignedUserId: null },
    });
  }
  log.push(`Moved ${allConvs.length} conversations to default-org, unassigned`);

  // 3. Move ALL customers to default-org
  const updated = await prisma.customer.updateMany({
    where: { orgId: { not: DEFAULT_ORG } },
    data: { orgId: DEFAULT_ORG },
  });
  log.push(`Moved ${updated.count} customers to default-org`);

  const finalCustomers = await prisma.customer.findMany({
    select: { id: true, firstName: true, lastName: true, phone: true },
    orderBy: { phone: "asc" },
  });
  const finalConvs = await prisma.conversation.findMany({
    select: { id: true, customerId: true, assignedUserId: true, orgId: true, status: true, lastMessageAt: true },
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
  });

  return NextResponse.json({ log, totalCustomers: finalCustomers.length, totalConversations: finalConvs.length, finalCustomers, finalConvs });
}
