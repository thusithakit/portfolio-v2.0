import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";

let app: App | null = null;
let adminDb: Firestore | null = null;
let adminMessaging: Messaging | null = null;

try {
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey
    ? rawPrivateKey.replace(/\\n/g, "\n").replace(/"/g, "")
    : undefined;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const isValidPEM = privateKey && privateKey.includes("-----BEGIN PRIVATE KEY-----");

  if (clientEmail && privateKey && isValidPEM && projectId) {
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin initialized successfully.");
    } else {
      app = getApps()[0];
    }
    
    adminDb = getFirestore(app);
    adminMessaging = getMessaging(app);
  } else {
    console.warn("Firebase Admin credentials missing. Server-side features (FCM push) will be disabled.");
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

export { adminDb, adminMessaging };
export const isFirebaseAdminConfigured = !!app;
