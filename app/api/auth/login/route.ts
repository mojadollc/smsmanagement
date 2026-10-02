import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, ensureAdminExists } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureAdminExists();
  } catch (err) {
    console.error("[login] ensureAdminExists failed:", err);
    return NextResponse.json({ error: "Database not connected. Check DATABASE_URL." }, { status: 500 });
  }

  let email: string, password: string;
  try {
    const body = await req.json();
    email = body.email;
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password)
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  try {
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
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "Server error. Check server logs." }, { status: 500 });
  }
}
