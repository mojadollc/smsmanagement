import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const numbers = await prisma.twilioPhoneNumber.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(numbers);
}
