// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function readServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const obj = JSON.parse(raw) as ServiceAccount & { private_key?: string };
    if (obj.private_key?.includes("\\n")) obj.private_key = obj.private_key.replace(/\\n/g, "\n");
    return obj as ServiceAccount;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("FIREBASE_ADMIN: variables incompletas");
  }
  return { projectId, clientEmail, privateKey } as ServiceAccount;
}

const app = getApps()[0] ?? initializeApp({ credential: cert(readServiceAccount()) });
export const adminAuth = getAuth(app);
