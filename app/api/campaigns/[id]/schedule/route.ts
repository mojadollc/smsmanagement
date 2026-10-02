import { NextRequest, NextResponse } from "next/server";
import { scheduleCampaign } from "@/lib/scheduler";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { schedules, date } = await req.json();

  await scheduleCampaign(id, schedules, date ? new Date(date) : new Date());
  return NextResponse.json({ success: true });
}
