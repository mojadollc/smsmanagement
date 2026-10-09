import twilio from "twilio";
import { prisma } from "./prisma";

interface SettingsRow {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioMessagingServiceSid: string;
}

async function getSettings(): Promise<SettingsRow | null> {
  const rows = await prisma.$queryRaw<SettingsRow[]>`
    SELECT "twilioAccountSid", "twilioAuthToken", "twilioMessagingServiceSid"
    FROM "Settings" WHERE id = 'singleton' LIMIT 1
  `.catch(() => []);
  return rows[0] ?? null;
}

async function getClient() {
  const settings = await getSettings();

  const sid = settings?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID!;
  const token = settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN!;

  if (!sid || !token) throw new Error("Twilio credentials not configured. Go to Settings to add them.");

  return { client: twilio(sid, token), settings };
}

async function getAppUrl(): Promise<string> {
  const rows = await prisma.$queryRaw<{ appUrl: string }[]>`
    SELECT "appUrl" FROM "Settings" WHERE id = 'singleton' LIMIT 1
  `.catch(() => []);
  return rows[0]?.appUrl || process.env.APP_URL || "";
}

export async function sendSMS(to: string, body: string) {
  const { client, settings } = await getClient();
  const messagingServiceSid =
    settings?.twilioMessagingServiceSid || process.env.TWILIO_MESSAGING_SERVICE_SID!;

  const appUrl = await getAppUrl();
  const statusCallback = appUrl ? `${appUrl}/api/webhooks/twilio/status` : undefined;

  return client.messages.create({ to, body, messagingServiceSid, ...(statusCallback ? { statusCallback } : {}) });
}

export async function getMessage(sid: string) {
  const { client } = await getClient();
  return client.messages(sid).fetch();
}

export async function getPhoneNumbers() {
  const { client } = await getClient();
  return client.incomingPhoneNumbers.list();
}

export async function getAccountBalance(): Promise<{ balance: string; currency: string } | null> {
  try {
    const { client } = await getClient();
    const bal = await (client as any).balance.fetch();
    return { balance: bal.balance, currency: bal.currency };
  } catch {
    return null;
  }
}

export async function validateWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
) {
  const settings = await getSettings();
  const token = settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN!;
  return twilio.validateRequest(token, signature, url, params);
}
