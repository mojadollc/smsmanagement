import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TARGET_PHONES = ["+14073954525", "+18774544182", "+16043604433"];

async function main() {
  // 1. Find hearbet1 user
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: { contains: "hearbet1" } }, { name: { contains: "hearbet1" } }] },
  });
  console.log("User found:", JSON.stringify(user, null, 2));

  if (!user) {
    console.log("hearbet1 user not found. Listing all users...");
    const all = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
    console.log(JSON.stringify(all, null, 2));
    return;
  }

  // 2. Find customers with those phone numbers
  const customers = await prisma.customer.findMany({
    where: { phone: { in: TARGET_PHONES } },
    select: { id: true, firstName: true, lastName: true, phone: true, orgId: true },
  });
  console.log("Customers found:", JSON.stringify(customers, null, 2));

  // 3. Find all conversations for those customers
  const customerIds = customers.map((c) => c.id);
  const conversations = await prisma.conversation.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true, customerId: true, assignedUserId: true, status: true, orgId: true },
  });
  console.log("Conversations found:", JSON.stringify(conversations, null, 2));

  // 4. Assign all those conversations to hearbet1
  const convIds = conversations.map((c) => c.id);
  if (convIds.length > 0) {
    const updated = await prisma.conversation.updateMany({
      where: { id: { in: convIds } },
      data: { assignedUserId: user.id },
    });
    console.log(`Updated ${updated.count} conversations -> assignedUserId = ${user.id}`);
  } else {
    console.log("No conversations found for those phone numbers.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
