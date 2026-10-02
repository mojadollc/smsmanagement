import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Bulk import
  if (Array.isArray(body)) {
    let imported = 0, skipped = 0;
    for (const row of body) {
      try {
        await prisma.customer.create({
          data: {
            firstName: row.firstName || "Unknown",
            lastName: row.lastName || row.phone,
            phone: row.phone,
            email: row.email || null,
          },
        });
        imported++;
      } catch {
        skipped++; // duplicate or invalid
      }
    }
    return NextResponse.json({ imported, skipped });
  }

  const { firstName, lastName, phone, email } = body;
  if (!firstName || !lastName || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
  }

  const customer = await prisma.customer.create({
    data: { firstName, lastName, phone, email },
  });

  return NextResponse.json(customer, { status: 201 });
}
