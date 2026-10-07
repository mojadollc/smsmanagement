import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "";

  // prisma+postgres:// is the Prisma local dev server — use native client, no adapter
  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma+pg://")) {
    return new PrismaClient({ log: ["error"] });
  }

  // Standard postgres:// — use PrismaPg driver adapter
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: url, max: 5 });
  return new PrismaClient({ adapter, log: ["error"] });
}

if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient();

export const prisma = globalForPrisma.prisma;
