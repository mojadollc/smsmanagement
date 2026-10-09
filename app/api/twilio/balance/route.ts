import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAccountBalance } from "@/lib/twilio";

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const balance = await getAccountBalance();
  if (!balance) return NextResponse.json({ error: "Failed to fetch balance" }, { status: 502 });

  return NextResponse.json(balance);
}
