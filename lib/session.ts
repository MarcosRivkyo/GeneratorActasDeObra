import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function requireSession() {
  const c = await cookies();
  const session = c.get("__session")?.value;
  const loginUrl = process.env.PORTFOLIO_LOGIN_URL || "/";
  const next = process.env.APP_ORIGIN || "";

  if (!session) redirect(`${loginUrl}?next=${encodeURIComponent(next)}`);

  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch {
    redirect(`${loginUrl}?next=${encodeURIComponent(next)}`);
  }
}
