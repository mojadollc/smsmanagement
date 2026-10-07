import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ORG = "default-org";

export async function GET() {
  const log: string[] = [];

  // Move ALL users to default-org
  const users = await prisma.user.findMany({ select: { id: true, email: true, orgId: true } });
  for (const u of users) {
    if (u.orgId !== DEFAULT_ORG) {
      await prisma.user.update({ where: { id: u.id }, data: { orgId: DEFAULT_ORG } });
      log.push(`Moved user ${u.email} from ${u.orgId} to default-org`);
    }
  }

  // Move ALL campaigns to default-org
  const camps = await prisma.campaign.updateMany({
    where: { orgId: { not: DEFAULT_ORG } },
    data: { orgId: DEFAULT_ORG },
  });
  log.push(`Moved ${camps.count} campaigns to default-org`);

  // Move ALL groups to default-org
  const groups = await prisma.group.updateMany({
    where: { orgId: { not: DEFAULT_ORG } },
    data: { orgId: DEFAULT_ORG },
  });
  log.push(`Moved ${groups.count} groups to default-org`);

  // Confirm final state
  const finalUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true, orgId: true, role: true } });
  const convCount = await prisma.conversation.count({ where: { orgId: DEFAULT_ORG } });
  const custCount = await prisma.customer.count({ where: { orgId: DEFAULT_ORG } });
  const campCount = await prisma.campaign.count({ where: { orgId: DEFAULT_ORG } });

  return NextResponse.json({ log, finalUsers, convCount, custCount, campCount });
}
