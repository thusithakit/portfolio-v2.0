import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we have active configuration keys
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

let app;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.warn("Firebase initialization failed, falling back to mock database:", error);
  }
} else {
  if (typeof window !== "undefined") {
    console.info("Firebase environment variables not set. Contact submissions will fall back to local mock storage.");
  }
}

export { db, isFirebaseConfigured };

// Submission interface
export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

// Helper to save a message
export async function saveContactMessage(data: Omit<ContactSubmission, "timestamp">) {
  const submission: ContactSubmission = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  if (db) {
    const contactRef = collection(db, "contacts");
    await addDoc(contactRef, submission);
    return { success: true, destination: "firestore" };
  } else {
    // Local mock database fallback
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("contact_submissions") || "[]");
      existing.push(submission);
      localStorage.setItem("contact_submissions", JSON.stringify(existing));
    }
    // Simulate database network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true, destination: "mock_db", data: submission };
  }
}
