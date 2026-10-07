import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sms-management-secret-change-in-production"
);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; role: string; orgId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; role: string; orgId: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.active) return null;
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function ensureAdminExists() {
  const count = await prisma.user.count();
  if (count === 0) {
    const org = await prisma.organization.upsert({
      where: { id: "default-org" },
      update: {},
      create: { id: "default-org", name: "Default Organization" },
    });
    await prisma.user.create({
      data: {
        email: "admin@sms.local",
        name: "Admin",
        password: await hashPassword("admin123"),
        role: "admin",
        orgId: org.id,
      },
    });
  }
}
