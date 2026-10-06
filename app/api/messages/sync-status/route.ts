import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMessage } from "@/lib/twilio";

// Polls Twilio for messages stuck in queued/sent status and updates them
export async function POST() {
  try {
    // Find messages that haven't been updated beyond queued/sent in the last 2 hours
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const stale = await prisma.message.findMany({
      where: {
        direction: "outbound",
        status: { in: ["queued", "sent", "sending"] },
        twilioSid: { not: null },
        createdAt: { gte: cutoff },
      },
      take: 20,
    });

    if (stale.length === 0) return NextResponse.json({ synced: 0 });

    let synced = 0;
    await Promise.allSettled(
      stale.map(async (msg) => {
        if (!msg.twilioSid) return;
        try {
          const twilioMsg = await getMessage(msg.twilioSid);
          const newStatus = twilioMsg.status;
          if (newStatus !== msg.status) {
            const updateData: Record<string, unknown> = { status: newStatus };
            if (newStatus === "delivered") updateData.deliveredAt = new Date();
            if (newStatus === "sent") updateData.sentAt = new Date();
            if (twilioMsg.errorCode) updateData.errorCode = String(twilioMsg.errorCode);
            if (twilioMsg.errorMessage) updateData.errorMessage = twilioMsg.errorMessage;
            await prisma.message.update({ where: { id: msg.id }, data: updateData });
            synced++;
          }
        } catch {
          // Ignore individual fetch errors
        }
      })
    );

    return NextResponse.json({ synced, checked: stale.length });
  } catch (err) {
    console.error("[sync-status]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
