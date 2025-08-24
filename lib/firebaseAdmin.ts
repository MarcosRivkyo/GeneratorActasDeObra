// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const obj = JSON.parse(raw);
    if (obj.private_key?.includes("\\n")) obj.private_key = obj.private_key.replace(/\\n/g, "\n");
    return obj;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("FIREBASE_ADMIN: variables incompletas");
  }
  return { projectId, clientEmail, privateKey };
}

const app = getApps()[0] ?? initializeApp({ credential: cert(readServiceAccount() as any) });

export const adminAuth = getAuth(app);
