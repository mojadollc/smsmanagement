import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
  });
  return new PrismaClient({ adapter, log: ["error"] });
}

if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient();

export const prisma = globalForPrisma.prisma;
