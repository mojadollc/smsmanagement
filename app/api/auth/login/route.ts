import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

interface GeoLocation {
  city?: string;
  region?: string;
  country?: string;
}

async function getGeoLocation(ip: string): Promise<GeoLocation> {
  try {
    // Skip localhost/private IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) {
      return { city: "Local", region: "Local", country: "Local" };
    }
    
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`, {
      signal: AbortSignal.timeout(2000), // 2s timeout
    });
    const data = await res.json();
    
    if (data.status === "success") {
      return {
        city: data.city,
        region: data.regionName,
        country: data.country,
      };
    }
    return {};
  } catch {
    return {};
  }
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
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
    
    // Get IP and location
    const ip = getClientIp(req);
    const geo = await getGeoLocation(ip);
    
    // Update user with login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        loginCity: geo.city,
        loginRegion: geo.region,
        loginCountry: geo.country,
      },
    });

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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
