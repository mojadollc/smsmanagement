import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, ensureAdminExists } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await ensureAdminExists();
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await verifyPassword(password, user.password);
  if (!valid)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await signToken({ userId: user.id, role: user.role });
  const res = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
