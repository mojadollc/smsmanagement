-- Create Organization table
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Insert a default org for all existing data
INSERT INTO "Organization" ("id", "name", "createdAt")
VALUES ('default-org', 'Default Organization', NOW());

-- Add orgId to User
ALTER TABLE "User" ADD COLUMN "orgId" TEXT NOT NULL DEFAULT 'default-org';
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add orgId to Customer, drop old unique on phone, add per-org unique
ALTER TABLE "Customer" ADD COLUMN "orgId" TEXT NOT NULL DEFAULT 'default-org';
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX IF EXISTS "Customer_phone_key";
CREATE UNIQUE INDEX "Customer_orgId_phone_key" ON "Customer"("orgId", "phone");

-- Add orgId to Group
ALTER TABLE "Group" ADD COLUMN "orgId" TEXT NOT NULL DEFAULT 'default-org';
ALTER TABLE "Group" ADD CONSTRAINT "Group_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add orgId to Conversation
ALTER TABLE "Conversation" ADD COLUMN "orgId" TEXT NOT NULL DEFAULT 'default-org';
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add orgId to Campaign
ALTER TABLE "Campaign" ADD COLUMN "orgId" TEXT NOT NULL DEFAULT 'default-org';
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
