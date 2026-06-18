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

  const writeToLocalFile = async () => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "contacts_fallback.json");
      let existing = [];
      if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8") || "[]");
      }
      existing.push(submission);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write contact message to local fallback file:", err);
    }
  };

  if (db) {
    try {
      const contactRef = collection(db, "contacts");
      await addDoc(contactRef, submission);
      return { success: true, destination: "firestore" };
    } catch (error) {
      console.warn("Firestore write failed, falling back to local file. Error:", error);
      await writeToLocalFile();
      return { success: true, destination: "local_file_fallback" };
    }
  } else {
    // Local mock database fallback
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("contact_submissions") || "[]");
      existing.push(submission);
      localStorage.setItem("contact_submissions", JSON.stringify(existing));
    } else {
      // Server-side fallback when Firebase is not configured
      await writeToLocalFile();
    }
    // Simulate database network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true, destination: "mock_db", data: submission };
  }
}
