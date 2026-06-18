"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Lock,
  Unlock,
  Loader2,
  LogOut,
  Bell,
  BellOff,
  User,
  Mail,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { db, isFirebaseConfigured } from "@/lib/firebase";

import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";

interface ChatMessage {
  id: string;
  sender: "visitor" | "admin";
  text: string;
  timestamp: Date | string | number | { seconds: number; nanoseconds: number };
}

const formatMessageTime = (
  timestamp: Date | string | number | { seconds: number; nanoseconds: number } | null | undefined
): string => {
  if (!timestamp) return "";
  try {
    let dateObj: Date;
    if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === "string" || typeof timestamp === "number") {
      dateObj = new Date(timestamp);
    } else if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
      dateObj = new Date(timestamp.seconds * 1000);
    } else {
      return "";
    }
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

interface ChatSession {
  id: string;
  visitorName: string;
  visitorEmail: string;
  lastMessage: string;
  lastActive: string;
  unreadCountAdmin: number;
  unreadCountVisitor: number;
  typingVisitor?: boolean;
}

export default function AdminChatPage() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Chat states
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingVisitor, setTypingVisitor] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Push notification states
  const [pushSupported, setPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMockMode = !isFirebaseConfigured || !db;

  // 1. Check existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // 2. Initialize Push Notification support checks & register FCM Service Worker
  useEffect(() => {
    if (isAuthenticated && typeof window !== "undefined") {
      const hasSupport =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      
      setTimeout(async () => {
        setPushSupported(hasSupport);

        if (hasSupport) {
          try {
            await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            
            // Check if permission is already granted and token exists in localStorage
            if (Notification.permission === "granted") {
              const savedToken = localStorage.getItem("fcm_registration_token");
              if (savedToken) {
                setFcmToken(savedToken);
                setIsSubscribed(true);
              }
            }
          } catch (err) {
            console.error("FCM Service Worker registration failed:", err);
          }
        }
      }, 0);
    }
  }, [isAuthenticated]);

  // 3. Real-time active chats list listener
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!isMockMode && db) {
      const chatsQuery = query(collection(db, "chats"), orderBy("lastActive", "desc"));
      
      const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const list: ChatSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            visitorName: data.visitorName || "Anonymous Visitor",
            visitorEmail: data.visitorEmail || "",
            lastMessage: data.lastMessage || "",
            lastActive: data.lastActive || "",
            unreadCountAdmin: data.unreadCountAdmin || 0,
            unreadCountVisitor: data.unreadCountVisitor || 0,
            typingVisitor: !!data.typingVisitor,
          });
        });
        setChats(list);
      });

      return () => unsubscribe();
    } else {
      // Mock mode: fetch from fallback files
      const loadLocalChats = async () => {
        try {
          const response = await fetch("/api/chat/message");
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const list = Object.values(data.chats || {}).map((c: any) => ({
                id: c.id,
                visitorName: c.visitorName,
                visitorEmail: c.visitorEmail,
                lastMessage: c.lastMessage,
                lastActive: c.lastActive,
                unreadCountAdmin: c.unreadCountAdmin,
                unreadCountVisitor: c.unreadCountVisitor,
              }));
              // Sort by last active date desc
              list.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
              setChats(list);
            }
          }
        } catch (err) {
          console.error("Local mock chats load failed:", err);
        }
      };

      loadLocalChats();
      const interval = setInterval(loadLocalChats, 4000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isMockMode]);

  // 4. Real-time messages listener for selected chat
  useEffect(() => {
    if (!isAuthenticated || !selectedChatId) return;

    if (!isMockMode && db) {
      // Listen to messages subcollection
      const messagesQuery = query(
        collection(db, "chats", selectedChatId, "messages"),
        orderBy("timestamp", "asc")
      );

      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            sender: data.sender,
            text: data.text,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
          });
        });
        setMessages(list);
      });

      // Listen to typing status & reset unread count
      const chatDocRef = doc(db, "chats", selectedChatId);
      const unsubscribeChat = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTypingVisitor(!!data.typingVisitor);

          // Clear admin unread count when chat is selected
          if (data.unreadCountAdmin > 0) {
            setDoc(chatDocRef, { unreadCountAdmin: 0 }, { merge: true }).catch(console.error);
          }
        }
      });

      return () => {
        unsubscribeMessages();
        unsubscribeChat();
      };
    } else {
      // Mock mode messages fetch
      const loadLocalMessages = async () => {
        try {
          const response = await fetch(`/api/chat/message?chatId=${selectedChatId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setMessages(data.messages || []);
            }
          }
        } catch (err) {
          console.error("Local mock messages load failed:", err);
        }
      };

      loadLocalMessages();
      const interval = setInterval(loadLocalMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChatId, isAuthenticated, isMockMode]);

  // 5. Scroll message pane to bottom
  useEffect(() => {
    if (selectedChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedChatId]);

  // 6. Handle Login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError(data.message || "Invalid password");
      }
    } catch (err) {
      setAuthError("Failed to connect to authentication server.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 7. Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setSelectedChatId(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 8. Handle Admin typing state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (isMockMode || !db || !selectedChatId) return;

    const chatDocRef = doc(db, "chats", selectedChatId);
    setDoc(chatDocRef, { typingAdmin: true }, { merge: true }).catch(console.error);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(chatDocRef, { typingAdmin: false }, { merge: true }).catch(console.error);
    }, 2000);
  };

  // 9. Send Reply message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: "opt_admin_" + Date.now(),
      sender: "admin",
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedChatId,
          text: textToSend,
          sender: "admin",
        }),
      });

      if (!res.ok) {
        throw new Error("Reply failed");
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsSending(false);
      // Reset typing state
      if (!isMockMode && db && selectedChatId) {
        const chatDocRef = doc(db, "chats", selectedChatId);
        setDoc(chatDocRef, { typingAdmin: false }, { merge: true }).catch(console.error);
      }
    }
  };

  // 10. Enable FCM Push notifications
  const handleEnablePush = async () => {
    if (!pushSupported) return;
    setPushLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Push permissions denied. Please enable notifications in your browser settings.");
        setPushLoading(false);
        return;
      }

      // We initialize the service worker registration
      const registration = await navigator.serviceWorker.ready;

      // To handle token retrieval via FCM, we fetch it using the web app client SDK
      // Import the dynamic firebase modules to prevent SSR crashes
      const { getApp } = await import("firebase/app");
      const { getMessaging, getToken } = await import("firebase/messaging");

      const app = getApp();
      const messaging = getMessaging(app);

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY;
      if (!vapidKey) {
        alert(
          "FCM VAPID certificate key is missing in your environment configuration (.env).\nPlease add NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY."
        );
        setPushLoading(false);
        return;
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        // Post token to backend to save in database
        const res = await fetch("/api/chat/fcm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setFcmToken(token);
          localStorage.setItem("fcm_registration_token", token);
          setIsSubscribed(true);
          alert("Successfully registered device for FCM Push Notifications!");
        } else {
          alert("FCM API failed to register token.");
        }
      } else {
        alert("Failed to retrieve FCM push registration token.");
      }
    } catch (err) {
      console.error("Enable push error:", err);
      alert("Error initializing push service: " + (err as Error).message);
    } finally {
      setPushLoading(false);
    }
  };

  // 11. Disable Push Notifications
  const handleDisablePush = async () => {
    if (!fcmToken) return;
    setPushLoading(true);

    try {
      const res = await fetch("/api/chat/fcm", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fcmToken }),
      });

      if (res.ok) {
        setIsSubscribed(false);
        setFcmToken("");
        localStorage.removeItem("fcm_registration_token");
        alert("Disabled push notifications on this device.");
      }
    } catch (err) {
      console.error("Unregister push error:", err);
    } finally {
      setPushLoading(false);
    }
  };

  // Helper date formatter
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return "just now";
    } catch (e) {
      return "";
    }
  };

  // Auth Checking Loading screen
  if (isAuthChecking) {
    return (
      <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-peach-300 mb-4" />
        <span className="font-mono text-xs text-ink-200">Verifying session...</span>
      </div>
    );
  }

  // Password Verification screen
  if (!isAuthenticated) {
    return (
      <main className="flex-grow flex items-center justify-center px-4 py-20 relative z-10">
        <div className="w-full max-w-[400px] p-6 md:p-8 bg-panel-bg border border-panel-border rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-full bg-peach-400/10 flex items-center justify-center text-peach-300 mb-3 animate-pulse">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="font-display text-xl font-bold text-cream-100">Admin Live Chat</h1>
            <p className="text-xs text-ink-200 mt-1">Unlock the real-time communications console.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 relative">
              <label htmlFor="admin-password" className="contact-label text-[9px] tracking-wider">Access Password</label>
              <input
                type="password"
                id="admin-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="contact-input text-center text-sm py-2"
                required
                disabled={isAuthenticating}
              />
            </div>

            {authError && (
              <span className="text-[10px] text-red-400 font-mono text-center">{authError}</span>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="mt-2 min-h-[44px] rounded-full bg-cream-100 hover:bg-peach-300 text-ink-900 text-sm font-semibold transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-ink-900" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Unlock Console</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Active Admin Console
  return (
    <main className="flex-1 flex flex-col relative z-10 w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 select-none h-[calc(100vh-100px)] min-h-[500px]">
      
      {/* Console Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-panel-bg border border-panel-border p-4 rounded-xl shadow-lg backdrop-blur-md mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-peach-400/10 flex items-center justify-center text-peach-300">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-cream-100 text-lg leading-tight">Live Chat Console</h1>
            <span className="text-[10px] font-mono text-ink-300">
              {isMockMode ? "Mock Database Mode (JSON Fallback)" : "Firebase Database Connected"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between">
          {/* Notification Button */}
          {pushSupported && (
            <button
              onClick={isSubscribed ? handleDisablePush : handleEnablePush}
              disabled={pushLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isSubscribed
                  ? "bg-peach-400/10 border-peach-300/30 text-peach-300 hover:bg-peach-400/20"
                  : "bg-ink-800/60 border-ink-200/14 text-ink-200 hover:border-peach-300/40 hover:text-cream-100"
              }`}
            >
              {pushLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isSubscribed ? (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span>Push Active</span>
                </>
              ) : (
                <>
                  <BellOff className="h-3.5 w-3.5" />
                  <span>Enable Push</span>
                </>
              )}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 flex bg-panel-bg border border-panel-border rounded-xl shadow-lg backdrop-blur-md overflow-hidden relative">
        
        {/* Left Side: Sessions List */}
        <section
          className={`w-full md:w-[320px] lg:w-[360px] border-r border-panel-border flex flex-col ${
            mobileView === "chat" && selectedChatId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-panel-border bg-ink-900/10">
            <span className="font-mono text-[9px] uppercase tracking-wider text-ink-200">Active Conversations ({chats.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
            {chats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-300 opacity-60">
                <MessageSquare className="h-8 w-8 mb-2" />
                <span className="font-mono text-xs">No active chats</span>
                <span className="text-[10px] mt-1">Chat messages from visitors will appear here.</span>
              </div>
            ) : (
              chats.map((chat) => {
                const isSelected = selectedChatId === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      setMobileView("chat");
                    }}
                    className={`w-full px-4 py-3.5 text-left flex items-start gap-3 border-b border-ink-200/10 transition-all hover:bg-ink-200/5 cursor-pointer ${
                      isSelected ? "bg-peach-400/5 border-l-2 border-l-peach-300" : ""
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-ink-800/80 border border-ink-200/10 flex items-center justify-center text-peach-300 relative shrink-0">
                      <User className="h-4.5 w-4.5" />
                      {chat.unreadCountAdmin > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-peach-500 border-2 border-ink-900 animate-pulse" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-xs font-semibold text-cream-100 truncate pr-2">
                          {chat.visitorName}
                        </span>
                        <span className="text-[9px] font-mono text-ink-300 shrink-0">
                          {formatTimeAgo(chat.lastActive)}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-200 truncate pr-4">
                        {chat.lastMessage || "(No messages)"}
                      </p>
                      {chat.typingVisitor && (
                        <span className="text-[9px] font-mono text-peach-300 animate-pulse">visitor typing...</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right Side: Message Stream */}
        <section
          className={`flex-1 flex flex-col ${
            mobileView === "list" && !selectedChatId ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedChatId ? (
            <>
              {/* Message Pane Header */}
              <header className="flex justify-between items-center px-4 py-3 border-b border-panel-border bg-ink-900/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-1.5 rounded-full text-ink-200 hover:text-cream-100 hover:bg-ink-200/10 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-cream-100">
                      {chats.find((c) => c.id === selectedChatId)?.visitorName || "Conversation"}
                    </span>
                    {chats.find((c) => c.id === selectedChatId)?.visitorEmail && (
                      <span className="text-[10px] font-mono text-ink-300 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span>{chats.find((c) => c.id === selectedChatId)?.visitorEmail}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <span className="text-[9px] font-mono text-peach-300 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>ID: {selectedChatId.replace("chat_", "")}</span>
                </span>
              </header>

              {/* Message List Pane */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {messages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${
                        isAdmin ? "self-end items-end" : "self-start items-start"
                      } animate-fadeIn`}
                    >
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isAdmin
                            ? "bg-peach-300 text-ink-900 rounded-tr-none"
                            : "bg-ink-800/80 text-cream-100 border border-ink-200/10 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.timestamp && formatMessageTime(msg.timestamp) && (
                        <span className="text-[8px] font-mono text-ink-300 mt-1.5 px-1">
                          {formatMessageTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Visitor Typing alert */}
                {typingVisitor && (
                  <div className="self-start flex items-center gap-1.5 bg-ink-800/40 border border-ink-200/10 px-3.5 py-2.5 rounded-2xl rounded-tl-none">
                    <span className="h-1.5 w-1.5 bg-peach-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 bg-peach-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 bg-peach-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 bg-ink-900/20 border-t border-panel-border flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type a reply..."
                  disabled={isSending}
                  className="flex-1 min-h-[36px] bg-ink-800/50 border border-ink-200/14 rounded-full px-4 py-1.5 text-xs text-cream-100 focus:outline-none focus:border-peach-300 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="h-9 w-9 rounded-full bg-cream-100 hover:bg-peach-300 text-ink-900 flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  aria-label="Send reply"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-ink-900" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-65">
              <MessageSquare className="h-12 w-12 text-peach-300/40 mb-3 animate-pulse" />
              <h3 className="font-display font-semibold text-cream-100 text-sm">Select a Conversation</h3>
              <p className="text-[11px] text-ink-300 max-w-[240px] mt-1">
                Choose a conversation from the sidebar to view active messages and reply in real-time.
              </p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
