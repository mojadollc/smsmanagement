import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";

  const where = {
    orgId: user.orgId,
    ...(search ? {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, limit });
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 11) return `+1${digits.slice(-10)}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Bulk import
  if (Array.isArray(body)) {
    let imported = 0, skipped = 0;
    for (const row of body) {
      try {
        const phone = normalizePhone(row.phone);
        await prisma.customer.create({
          data: { orgId: user.orgId, firstName: row.firstName || "Unknown", lastName: row.lastName || phone, phone, email: row.email || null },
        });
        imported++;
      } catch { skipped++; }
    }
    return NextResponse.json({ imported, skipped });
  }

  const { firstName, lastName, phone: rawPhone, email } = body;
  if (!firstName || !lastName || !rawPhone)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const phone = normalizePhone(rawPhone);
  const existing = await prisma.customer.findUnique({ where: { orgId_phone: { orgId: user.orgId, phone } } });
  if (existing) return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });

  const customer = await prisma.customer.create({ data: { orgId: user.orgId, firstName, lastName, phone, email } });
  return NextResponse.json(customer, { status: 201 });
}
