# SMS Management System

Twilio-powered SMS management dashboard built with Next.js, Prisma, and PostgreSQL.

## Stack

- **Frontend**: Next.js 16 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **SMS**: Twilio Programmable Messaging (Messaging Service)
- **Database**: PostgreSQL + Prisma ORM
- **Workers**: Node.js + ts-node
- **Deployment**: DigitalOcean VPS + Nginx + PM2

## Setup

### 1. Environment variables

```bash
cp .env.example .env
```

Fill in:
- `TWILIO_ACCOUNT_SID` — from Twilio Console
- `TWILIO_AUTH_TOKEN` — from Twilio Console
- `TWILIO_MESSAGING_SERVICE_SID` — create a Messaging Service in Twilio
- `DATABASE_URL` — PostgreSQL connection string

### 2. Database

```bash
npm run db:migrate
npm run db:generate
```

### 3. Twilio Messaging Service configuration

In your Twilio Messaging Service, set:

- **Incoming Message Webhook**: `https://yourdomain.com/api/webhooks/twilio/incoming`
- **Status Callback**: `https://yourdomain.com/api/webhooks/twilio/status`
- Enable **Advanced Opt-Out** for STOP/START/HELP handling

### 4. Development

```bash
npm run dev          # Next.js dashboard
npm run worker       # SMS queue worker (separate terminal)
npm run scheduler    # Campaign scheduler (separate terminal)
```

### 5. Production (PM2)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

## Architecture

```
Next.js Dashboard
      │
      ├── API Routes (/api/*)
      │       │
      │       ├── PostgreSQL (via Prisma)
      │       └── Twilio API (via lib/twilio.ts)
      │
      ├── SMS Worker (worker/sms-worker.ts)
      │       Polls sms_queue every 60s, sends due jobs via Twilio
      │
      └── Scheduler Worker (worker/scheduler-worker.ts)
              Syncs campaign statuses
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/customers` | List / create customers |
| GET/PUT/DELETE | `/api/customers/:id` | Customer detail |
| POST | `/api/messages/send` | Send single SMS |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id` | Conversation with messages |
| POST | `/api/conversations/:id/reply` | Reply to conversation |
| GET/POST | `/api/campaigns` | List / create campaigns |
| GET/PUT | `/api/campaigns/:id` | Campaign detail |
| POST | `/api/campaigns/:id/schedule` | Schedule campaign |
| POST | `/api/campaigns/:id/pause` | Pause campaign |
| POST | `/api/campaigns/:id/resume` | Resume campaign |
| POST | `/api/campaigns/:id/cancel` | Cancel campaign |
| POST | `/api/webhooks/twilio/incoming` | Twilio inbound SMS webhook |
| POST | `/api/webhooks/twilio/status` | Twilio delivery status webhook |
| GET | `/api/phone-numbers` | List phone numbers |
| GET | `/api/reports` | Dashboard stats |

## Daily Limit & Scheduling

Create a campaign with batch schedules:

```json
{
  "schedules": [
    { "time": "09:00", "count": 50 },
    { "time": "11:00", "count": 30 },
    { "time": "13:00", "count": 20 },
    { "time": "15:00", "count": 50 },
    { "time": "17:00", "count": 50 }
  ],
  "dailyLimit": 200
}
```

The SMS worker picks up jobs from `sms_queue` every minute and sends only those whose `scheduled_at <= now`.

## Opt-Out Handling

Twilio Advanced Opt-Out sends `OptOutType` in the webhook:
- `STOP` → sets `customer.smsOptOut = true`, blocks future sends
- `START` → re-enables SMS consent
- `HELP` → logged, no action

Customers with `smsOptOut = true` are skipped by the worker before any Twilio API call.
