import { NextRequest } from "next/server";

export const runtime = "nodejs";

const allowOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const h: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Credentials": "true",
  };
  if (allowOrigins.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const isDev = process.env.NODE_ENV !== "production";
  const parts = ["__session=;", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (!isDev) parts.push("Secure");

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": parts.join("; "), ...headers },
  });
}
