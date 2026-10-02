import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID!;

export async function sendSMS(to: string, body: string) {
  return client.messages.create({
    to,
    body,
    messagingServiceSid,
  });
}

export async function getMessage(sid: string) {
  return client.messages(sid).fetch();
}

export async function getPhoneNumbers() {
  return client.incomingPhoneNumbers.list();
}

export function validateWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
) {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
