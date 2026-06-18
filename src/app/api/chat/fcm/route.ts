import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import fs from "fs";
import path from "path";

// Verify session helper
async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  const adminPassword = process.env.ADMIN_CHAT_PASSWORD || "admin";
  const expectedToken = createHash("sha256").update(adminPassword).digest("hex");
  return !!(sessionCookie && sessionCookie.value === expectedToken);
}

// Local fallback database operations
const FALLBACK_FILE = path.join(process.cwd(), "fcm_tokens_fallback.json");

function getFallbackTokens(): string[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf-8") || "[]");
    }
  } catch (err) {
    console.error("Failed to read fallback FCM tokens:", err);
  }
  return [];
}

function saveFallbackTokens(tokens: string[]) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(tokens, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save fallback FCM tokens:", err);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate Admin
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 400 });
    }

    // 2. Save FCM Token
    if (adminDb) {
      const tokenRef = adminDb.collection("fcm_tokens").doc(token);
      await tokenRef.set({
        token,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, destination: "firestore" });
    } else {
      // Local fallback
      const tokens = getFallbackTokens();
      if (!tokens.includes(token)) {
        tokens.push(token);
        saveFallbackTokens(tokens);
      }
      return NextResponse.json({ success: true, destination: "local_fallback" });
    }
  } catch (error) {
    console.error("FCM Token Register error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Authenticate Admin
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 400 });
    }

    // 2. Remove FCM Token
    if (adminDb) {
      await adminDb.collection("fcm_tokens").doc(token).delete();
      return NextResponse.json({ success: true, message: "Token deleted from firestore" });
    } else {
      // Local fallback
      let tokens = getFallbackTokens();
      tokens = tokens.filter((t) => t !== token);
      saveFallbackTokens(tokens);
      return NextResponse.json({ success: true, message: "Token deleted from local fallback" });
    }
  } catch (error) {
    console.error("FCM Token Unregister error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
