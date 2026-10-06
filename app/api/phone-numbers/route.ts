import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPhoneNumbers } from "@/lib/twilio";

export async function GET() {
  try {
    // Fetch phone numbers from Twilio API
    const twilioNumbers = await getPhoneNumbers();
    
    // Sync to local database
    for (const num of twilioNumbers) {
      await prisma.twilioPhoneNumber.upsert({
        where: { twilioSid: num.sid },
        update: {
          phoneNumber: num.phoneNumber,
          smsEnabled: num.capabilities?.sms ?? true,
          mmsEnabled: num.capabilities?.mms ?? true,
          status: num.status ?? "active",
        },
        create: {
          phoneNumber: num.phoneNumber,
          twilioSid: num.sid,
          smsEnabled: num.capabilities?.sms ?? true,
          mmsEnabled: num.capabilities?.mms ?? true,
          status: num.status ?? "active",
        },
      });
    }
    
    // Return synced numbers from database
    const numbers = await prisma.twilioPhoneNumber.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(numbers);
  } catch (error) {
    console.error("Failed to fetch phone numbers:", error);
    // Fall back to database records if Twilio API fails
    const numbers = await prisma.twilioPhoneNumber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(numbers);
  }
}
