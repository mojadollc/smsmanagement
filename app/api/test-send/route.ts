import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleCampaign } from "@/lib/scheduler";

export async function POST() {
  const testContacts = [
    { firstName: "Test", lastName: "One",   phone: "+16047544733" },
    { firstName: "Test", lastName: "Two",   phone: "+16043604433" },
    { firstName: "Test", lastName: "Three", phone: "+18338403506" },
  ];

  // Upsert customers
  const customerIds: string[] = [];
  for (const c of testContacts) {
    const existing = await prisma.customer.findUnique({ where: { phone: c.phone } });
    if (existing) {
      customerIds.push(existing.id);
    } else {
      const created = await prisma.customer.create({ data: c });
      customerIds.push(created.id);
    }
  }

  // Create campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: "Test Bulk Send — Dash",
      message: "Hi this is Dash from Bhatia Development group",
      dailyLimit: 200,
      totalCount: customerIds.length,
      pending: customerIds.length,
      status: "draft",
      recipients: {
        create: customerIds.map((id) => ({ customerId: id })),
      },
    },
  });

  // Get current time in Vancouver (US Pacific) as HH:MM
  const nowVancouver = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Vancouver",
  });

  // Schedule immediately — one slot now, all contacts
  await scheduleCampaign(
    campaign.id,
    [{ time: nowVancouver, count: customerIds.length }],
    new Date()
  );

  return NextResponse.json({ success: true, campaignId: campaign.id });
}
