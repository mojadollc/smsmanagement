# SMS Management System

Twilio-powered SMS management dashboard built with Next.js, Prisma, and PostgreSQL.

## Stack

- **Frontend**: Next.js 16 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **SMS**: Twilio Programmable Messaging (Messaging Service)
- **Database**: PostgreSQL + Prisma ORM
- **Workers**: Node.js + ts-node
- **Deployment**: DigitalOcean VPS + Nginx + PM2

---

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

---

## Project Structure

```
sms-management/
├── app/
│   ├── page.tsx                        # Root redirect → /login or /dashboard
│   ├── layout.tsx                      # Root layout
│   ├── globals.css
│   ├── login/page.tsx                  # Login page
│   │
│   ├── dashboard/                      # Protected dashboard area
│   │   ├── layout.tsx                  # Dashboard shell (sidebar + auth guard)
│   │   ├── page.tsx                    # Overview / stats
│   │   ├── inbox/page.tsx              # Conversations inbox
│   │   ├── messages/page.tsx           # Send single SMS
│   │   ├── customers/
│   │   │   ├── page.tsx                # Customer list
│   │   │   └── [id]/page.tsx           # Customer detail
│   │   ├── groups/
│   │   │   ├── page.tsx                # Group list
│   │   │   └── [id]/page.tsx           # Group detail + members
│   │   ├── campaigns/
│   │   │   ├── page.tsx                # Campaign list
│   │   │   ├── new/page.tsx            # Create campaign
│   │   │   └── [id]/page.tsx           # Campaign detail
│   │   ├── phone-numbers/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── admin/page.tsx              # Admin panel (users, system settings)
│   │   └── how-to-use/page.tsx
│   │
│   └── api/                            # API Route Handlers
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── customers/
│       │   ├── route.ts                # GET list, POST create
│       │   └── [id]/route.ts           # GET, PUT, DELETE
│       ├── groups/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/members/route.ts
│       ├── conversations/
│       │   ├── route.ts                # GET list
│       │   ├── [id]/route.ts           # GET with messages
│       │   └── [id]/reply/route.ts
│       ├── messages/
│       │   ├── send/route.ts           # Send single SMS immediately
│       │   └── sync-status/route.ts
│       ├── campaigns/
│       │   ├── route.ts                # GET list, POST create
│       │   ├── [id]/route.ts           # GET, PUT
│       │   ├── [id]/schedule/route.ts
│       │   ├── [id]/pause/route.ts
│       │   ├── [id]/resume/route.ts
│       │   └── [id]/cancel/route.ts
│       ├── phone-numbers/route.ts
│       ├── reports/route.ts
│       ├── settings/route.ts
│       ├── user/
│       │   ├── update/route.ts
│       │   └── reset-password/route.ts
│       ├── admin/users/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── test-send/route.ts
│       └── webhooks/twilio/
│           ├── incoming/route.ts       # Inbound SMS from Twilio
│           └── status/route.ts         # Delivery status callbacks
│
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   └── StatCard.tsx
│   ├── campaigns/
│   │   ├── CampaignForm.tsx
│   │   └── CampaignList.tsx
│   ├── customers/CustomerList.tsx
│   ├── inbox/InboxView.tsx
│   ├── messages/SendSmsForm.tsx
│   ├── admin/
│   │   ├── SystemSettings.tsx
│   │   └── WebhooksTab.tsx
│   ├── how-to-use/
│   │   ├── GuidedTour.tsx
│   │   ├── OnboardingChecklist.tsx
│   │   └── ProductTour.tsx
│   └── ui/
│       ├── EmojiPicker.tsx
│       └── ThemeToggle.tsx
│
├── lib/
│   ├── auth.ts         # JWT session, role checks (admin/agent)
│   ├── prisma.ts       # Prisma client singleton
│   ├── twilio.ts       # Twilio client + sendSMS wrapper
│   ├── queue.ts        # SmsQueue write + processDueJobs
│   └── scheduler.ts    # Campaign scheduling logic (time → UTC conversion)
│
├── worker/
│   ├── sms-worker.ts           # Polls sms_queue every 10s, sends due SMS
│   └── scheduler-worker.ts     # Syncs campaign statuses every 60s
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── ecosystem.config.js         # PM2 process config
├── package.json
└── .env
```

---

## Database Models

```
Organization ──┬── User[]
               ├── Customer[] ──┬── Conversation[] ── Message[] ── DeliveryEvent[]
               ├── Campaign[]   ├── CampaignRecipient[]
               ├── Group[]      ├── SmsQueue[]
               └── Conversation[]└── OptInRecord[]
                                └── GroupMember[]

Group ── GroupMember[] ── Customer

Settings           (singleton row — Twilio creds, daily limit, timezone)
TwilioPhoneNumber  (synced from Twilio, linked to Conversations)
MessageTemplate    (reusable SMS templates)
SmsQueue           (job queue: campaignId?, customerId, phone, message, scheduledAt)
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login, sets session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Current user info |
| GET/POST | `/api/customers` | List / create customers |
| GET/PUT/DELETE | `/api/customers/:id` | Customer detail |
| GET/POST | `/api/groups` | List / create groups |
| GET/PUT/DELETE | `/api/groups/:id` | Group detail |
| GET/POST | `/api/groups/:id/members` | Group members |
| POST | `/api/messages/send` | Send single SMS immediately |
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
| GET/PUT | `/api/settings` | System settings |
| GET/POST | `/api/admin/users` | Admin: list / create users |
| GET/PUT/DELETE | `/api/admin/users/:id` | Admin: manage user |

---

## Current System Flow

### 1. Auth Flow

```
User → POST /api/auth/login
  → bcrypt verify password
  → sign JWT { userId, role, orgId } — 7 day expiry
  → set "session" cookie
  → all API routes call requireAuth() → reads cookie → verifies JWT → checks user.active
```

- Default admin is seeded on first boot if no users exist: `admin@sms.local` / `admin123`
- Roles: `admin` (full access) and `agent` (limited access)
- Twilio credentials are read from the `Settings` DB table first, falling back to `.env`

---

### 2. Send Single SMS (Immediate)

```
Dashboard → POST /api/messages/send { customerId, message }
  → requireAuth() check
  → check customer.smsOptOut → block if true
  → find or create Conversation (assigned to the sending user)
  → lib/twilio.ts → Twilio API via MessagingServiceSid
  → save Message { direction: "outbound", status: "queued" }
  → update conversation.lastMessageAt
  → Twilio fires status webhook → update Message.status
```

---

### 3. Campaign Flow

```
Step 1 — Create
  POST /api/campaigns { name, message, customerIds[], schedules, dailyLimit }
    → Campaign { status: "draft" }
    → CampaignRecipient[] { status: "pending" } for each customer

Step 2 — Schedule
  POST /api/campaigns/:id/schedule
    → lib/scheduler.ts reads Settings.timezone (default: America/Vancouver)
    → for each schedule slot { time: "HH:MM", count: N }:
        - skip opted-out customers → CampaignRecipient: "opted_out", Campaign.optedOut+1
        - replace {{first_name}} in message body
        - convert slot time to UTC using timezone offset
        - if scheduledAt is in the past → send in 5 seconds
        - write SmsQueue row { scheduledAt, status: "pending" }
        - CampaignRecipient → "queued"
    → Campaign status → "scheduled"

Step 3 — Worker sends (every 10s)
  sms-worker.ts → lib/queue.processDueJobs()
    → SELECT pending SmsQueue WHERE scheduledAt <= now, LIMIT 50
    → process in parallel chunks of 10
    → if customer.smsOptOut → SmsQueue: "skipped"
    → sendSMS() via Twilio
    → find or create Conversation
    → create Message { direction: "outbound", status: "sent" }
    → SmsQueue: "sent", twilioSid saved
    → Campaign: sent+1, pending-1
    → CampaignRecipient: "sent"

Step 4 — Delivery callback
  Twilio → POST /api/webhooks/twilio/status
    → log DeliveryEvent
    → update Message.status (delivered / failed / undelivered)
    → update SmsQueue.status
    → if campaign message + final status:
        delivered → Campaign.delivered+1, CampaignRecipient: "delivered"
        failed    → Campaign.failed+1,    CampaignRecipient: "failed"

Step 5 — Status sync (every 60s)
  scheduler-worker.ts
    → if Campaign.pending=0 and no pending queue jobs → status: "completed"
    → if Campaign.sent>0 and status="scheduled"       → status: "running"
  (Also auto-corrected on every GET /api/campaigns fetch)
```

**Example schedule payload:**

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

---

### 4. Inbound SMS Flow

```
Customer replies → Twilio → POST /api/webhooks/twilio/incoming
  │
  ├─ OptOutType present?
  │   STOP  → customer.smsOptOut=true, smsOptIn=false + OptInRecord logged
  │   START → customer.smsOptOut=false, smsOptIn=true + OptInRecord logged
  │   HELP  → OptInRecord logged only, no other action
  │   (returns empty TwiML response in all cases)
  │
  └─ Regular inbound message:
      → find customer by phone number
      → if not found → create Customer { firstName: "Unknown", lastName: <phone> }
      → find all Conversations for customer, pick most recent by lastMessageAt
      → if duplicates exist → merge all messages into most recent, delete duplicates
      → if no conversation → create new Conversation
      → auto-assign to hearbet1@gmail.com (hardcoded default agent) if unassigned
      → create Message { direction: "inbound", status: "received" }
      → conversation.unreadCount+1, lastMessageAt=now, status="open"
```

---

### 5. Background Workers

| Worker | File | Interval | Responsibility |
|--------|------|----------|----------------|
| SMS Worker | `worker/sms-worker.ts` | every **10s** | Sends due SmsQueue jobs (up to 50, in chunks of 10 parallel) |
| Scheduler Worker | `worker/scheduler-worker.ts` | every **60s** | Syncs campaign status: scheduled → running → completed |

Both run as separate PM2 processes alongside the Next.js app (`ecosystem.config.js`).

---

## Opt-Out Handling

Twilio Advanced Opt-Out sends `OptOutType` in the webhook:
- `STOP` → sets `customer.smsOptOut = true`, blocks all future sends
- `START` → re-enables SMS consent (`smsOptOut = false`, `smsOptIn = true`)
- `HELP` → logged to `OptInRecord`, no state change

Customers with `smsOptOut = true` are skipped by both the immediate send API and the queue worker before any Twilio API call is made.

---

## Notable Behaviors

- **Twilio credentials** — read from `Settings` DB table first, `.env` as fallback
- **Timezone** — scheduling uses `Settings.timezone` (default: `America/Vancouver`)
- **Default agent** — `hearbet1@gmail.com` is hardcoded in the incoming webhook; all inbound conversations auto-assign to this user if unassigned
- **Duplicate conversations** — incoming webhook merges duplicate conversations for the same customer into the most recent one automatically
- **Campaign status auto-correction** — `GET /api/campaigns` corrects stale `scheduled`/`running` statuses on every fetch, not just via the worker
- **Webhook signature validation** — `validateWebhook()` exists in `lib/twilio.ts` but is not currently called in any webhook route
