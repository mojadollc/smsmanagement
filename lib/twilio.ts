import twilio from "twilio";
import { prisma } from "./prisma";

async function getClient() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });

  const sid = settings?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID!;
  const token = settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN!;

  if (!sid || !token) throw new Error("Twilio credentials not configured. Go to Settings to add them.");

  return { client: twilio(sid, token), settings };
}

export async function sendSMS(to: string, body: string) {
  const { client, settings } = await getClient();
  const messagingServiceSid =
    settings?.twilioMessagingServiceSid || process.env.TWILIO_MESSAGING_SERVICE_SID!;

  return client.messages.create({ to, body, messagingServiceSid });
}

export async function getMessage(sid: string) {
  const { client } = await getClient();
  return client.messages(sid).fetch();
}

export async function getPhoneNumbers() {
  const { client } = await getClient();
  return client.incomingPhoneNumbers.list();
}

export async function validateWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
) {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const token = settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN!;
  return twilio.validateRequest(token, signature, url, params);
}
