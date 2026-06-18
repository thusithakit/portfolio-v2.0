import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Verify admin helper
async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  const adminPassword = process.env.ADMIN_CHAT_PASSWORD || "admin";
  const expectedToken = createHash("sha256").update(adminPassword).digest("hex");
  return !!(sessionCookie && sessionCookie.value === expectedToken);
}

// Local fallback database operations
const FALLBACK_CHAT_FILE = path.join(process.cwd(), "chats_fallback.json");
const FALLBACK_FCM_FILE = path.join(process.cwd(), "fcm_tokens_fallback.json");

interface FallbackMessage {
  id: string;
  sender: "visitor" | "admin";
  text: string;
  timestamp: string;
}

interface FallbackChat {
  id: string;
  visitorName: string;
  visitorEmail: string;
  lastMessage: string;
  lastActive: string;
  unreadCountAdmin: number;
  unreadCountVisitor: number;
  messages: FallbackMessage[];
}

function loadFallbackChats(): Record<string, FallbackChat> {
  try {
    if (fs.existsSync(FALLBACK_CHAT_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_CHAT_FILE, "utf-8") || "{}");
    }
  } catch (err) {
    console.error("Failed to read fallback chats file:", err);
  }
  return {};
}

function saveFallbackChats(chats: Record<string, FallbackChat>) {
  try {
    fs.writeFileSync(FALLBACK_CHAT_FILE, JSON.stringify(chats, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write fallback chats file:", err);
  }
}

function loadFallbackFcmTokens(): string[] {
  try {
    if (fs.existsSync(FALLBACK_FCM_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_FCM_FILE, "utf-8") || "[]");
    }
  } catch (err) {
    console.error("Failed to read fallback FCM tokens:", err);
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatId, text, sender, name = "", email = "" } = body;

    if (!chatId || !text || !sender) {
      return NextResponse.json({ success: false, message: "Missing required parameters" }, { status: 400 });
    }

    const timestampStr = new Date().toISOString();

    // 1. If admin, check credentials
    if (sender === "admin" && !(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: "Unauthorized admin request" }, { status: 401 });
    }

    let writeDestination = "mock";

    if (adminDb) {
      writeDestination = "firestore";
      // 2a. Write directly to Firebase Firestore
      const chatRef = adminDb.collection("chats").doc(chatId);
      const messagesRef = chatRef.collection("messages");

      const messageData = {
        sender,
        text,
        timestamp: FieldValue.serverTimestamp(),
      };

      // Create new message
      await messagesRef.add(messageData);

      // Update parent document
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chatUpdate: Record<string, any> = {
        id: chatId,
        lastMessage: text,
        lastActive: timestampStr,
      };

      if (sender === "visitor") {
        if (name) chatUpdate.visitorName = name;
        if (email) chatUpdate.visitorEmail = email;
        chatUpdate.unreadCountAdmin = FieldValue.increment(1);
      } else if (sender === "admin") {
        chatUpdate.unreadCountVisitor = FieldValue.increment(1);
      }

      await chatRef.set(chatUpdate, { merge: true });
    } else {
      writeDestination = "local_fallback";
      // 2b. Write to local file fallback
      const chats = loadFallbackChats();
      if (!chats[chatId]) {
        chats[chatId] = {
          id: chatId,
          visitorName: name || "Anonymous",
          visitorEmail: email || "",
          lastMessage: "",
          lastActive: "",
          unreadCountAdmin: 0,
          unreadCountVisitor: 0,
          messages: [],
        };
      }

      const chat = chats[chatId];
      chat.lastMessage = text;
      chat.lastActive = timestampStr;

      if (sender === "visitor") {
        if (name) chat.visitorName = name;
        if (email) chat.visitorEmail = email;
        chat.unreadCountAdmin += 1;
      } else {
        chat.unreadCountVisitor += 1;
      }

      chat.messages.push({
        id: Math.random().toString(36).substring(2, 9),
        sender,
        text,
        timestamp: timestampStr,
      });

      saveFallbackChats(chats);
    }

    // 3. Send Push Notifications (if visitor sent the message)
    if (sender === "visitor") {
      let tokens: string[] = [];

      if (adminDb) {
        const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokensSnapshot.forEach((doc: any) => {
          tokens.push(doc.id);
        });
      } else {
        tokens = loadFallbackFcmTokens();
      }

      if (tokens.length > 0) {
        if (adminMessaging) {
          try {
            const response = await adminMessaging.sendEachForMulticast({
              tokens,
              notification: {
                title: `New message from ${name || "Visitor"}`,
                body: text,
              },
              data: {
                chatId,
                click_action: `/admin/chat?chatId=${chatId}`,
              },
            });
            console.log(`FCM Multicast sent: ${response.successCount} success, ${response.failureCount} fail.`);
          } catch (err) {
            console.error("FCM sending error:", err);
          }
        } else {
          // Log local fallback message alerts (highly useful for local debugging)
          console.info(`[FCM Fallback Push Alert] To Admin Tokens: ${JSON.stringify(tokens)} | Msg: "${text}" from ${name || "Visitor"}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      destination: writeDestination,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("Message handling error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// Support GET requests for reading the chat history in local fallback mode
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      // Admin request to list all fallback chats (if admin authenticated)
      if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
      const chats = loadFallbackChats();
      return NextResponse.json({ success: true, chats });
    }

    // Load messages for specific chat
    const chats = loadFallbackChats();
    const chat = chats[chatId];
    if (!chat) {
      return NextResponse.json({ success: true, messages: [] });
    }

    // Reset unread count based on request role
    const isAdmin = await isAdminAuthenticated();
    if (isAdmin) {
      chat.unreadCountAdmin = 0;
    } else {
      chat.unreadCountVisitor = 0;
    }
    saveFallbackChats(chats);

    return NextResponse.json({ success: true, messages: chat.messages });
  } catch (error) {
    console.error("Get fallback messages error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
