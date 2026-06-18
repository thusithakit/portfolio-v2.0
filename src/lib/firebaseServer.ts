import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Submission interface
export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

// Helper to save a message (runs only on server side)
export async function saveContactMessage(data: Omit<ContactSubmission, "timestamp">) {
  const submission: ContactSubmission = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  const writeToLocalFile = async () => {
    try {
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
    // Server-side fallback when Firebase is not configured
    await writeToLocalFile();
    // Simulate database network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true, destination: "mock_db", data: submission };
  }
}
