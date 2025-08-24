// app/api/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "__session";
const MAX_AGE = 60 * 60 * 24 * 5; // 5 días

function setSessionCookie(res: NextResponse, value: string) {
  res.cookies.set({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

function isSameOrigin(url: string) {
  try {
    const dest = new URL(url);
    const allowed = (process.env.APP_ORIGIN || "http://localhost:3001").replace(/\/+$/, "");
    const base = new URL(allowed);
    return dest.origin === base.origin;
  } catch {
    return false;
  }
}

// app/api/session/route.ts
function buildSafeRedirect(pathOrUrl?: string) {
  const base = process.env.APP_ORIGIN || "http://localhost:3001";
  // sólo permitimos paths relativos
  const path = (pathOrUrl && pathOrUrl.startsWith("/")) ? pathOrUrl : "/";
  return new URL(path, base).toString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const nextParam = searchParams.get("next") || "/";

    if (!token) {
      // si no hay token, manda a la pantalla pública que quieres
      return NextResponse.redirect(buildSafeRedirect("/apps"));
    }

    await adminAuth.verifyIdToken(token);
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn: MAX_AGE * 1000 });

    const location = buildSafeRedirect(nextParam);
    const res = NextResponse.redirect(location);
    setSessionCookie(res, sessionCookie);
    return res;
  } catch (e) {
    console.error("GET /api/session error:", e);
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken = body.idToken || "";
    if (!idToken) return NextResponse.json({ error: "missing token" }, { status: 400 });

    await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: MAX_AGE * 1000 });

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, sessionCookie);
    return res;
  } catch (e) {
    console.error("POST /api/session error:", e);
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
}

