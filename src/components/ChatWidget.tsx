"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, User, Mail, Loader2, Sparkles } from "lucide-react";
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

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typingAdmin, setTypingAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMockMode = !isFirebaseConfigured || !db;

  // 1. Initialize session on mount
  useEffect(() => {
    const savedChatId = localStorage.getItem("chat_session_id");
    const savedName = localStorage.getItem("chat_visitor_name") || "";
    const savedEmail = localStorage.getItem("chat_visitor_email") || "";

    setTimeout(() => {
      setName(savedName);
      setEmail(savedEmail);

      if (savedChatId) {
        setChatId(savedChatId);
        setShowIntro(false);
      }
    }, 0);
  }, []);

  // 2. Real-time message & status listeners
  useEffect(() => {
    if (!chatId) return;

    if (!isMockMode && db) {
      // Listen to message subcollection
      const messagesQuery = query(
        collection(db, "chats", chatId, "messages"),
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

        // If chat is closed, count unread messages from admin
        if (!isOpen) {
          const lastMsg = list[list.length - 1];
          if (lastMsg && lastMsg.sender === "admin") {
            setUnreadCount((prev) => prev + 1);
          }
        }
      });

      // Listen to parent chat document for typing indicator
      const chatDocRef = doc(db, "chats", chatId);
      const unsubscribeChat = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTypingAdmin(!!data.typingAdmin);

          // Reset visitor unread count when chat is opened
          if (isOpen && data.unreadCountVisitor > 0) {
            setDoc(chatDocRef, { unreadCountVisitor: 0 }, { merge: true }).catch(console.error);
          }
        }
      });

      return () => {
        unsubscribeMessages();
        unsubscribeChat();
      };
    } else {
      // Mock mode loading
      const loadLocalMessages = async () => {
        try {
          const response = await fetch(`/api/chat/message?chatId=${chatId}`);
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
      // Poll mock messages every 4 seconds when open
      if (isOpen) {
        const interval = setInterval(loadLocalMessages, 4000);
        return () => clearInterval(interval);
      }
    }
  }, [chatId, isOpen, isMockMode]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        setUnreadCount(0);
      }, 0);

      // Reset unread visitor count on server
      if (!isMockMode && db && chatId) {
        const chatDocRef = doc(db, "chats", chatId);
        setDoc(chatDocRef, { unreadCountVisitor: 0 }, { merge: true }).catch(console.error);
      }
    }
  }, [messages, isOpen, chatId, isMockMode]);

  // 4. Handle Intro Submit (Starts chat session)
  const handleIntroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newChatId = "chat_" + Math.random().toString(36).substring(2, 15);

    localStorage.setItem("chat_session_id", newChatId);
    if (name) localStorage.setItem("chat_visitor_name", name);
    if (email) localStorage.setItem("chat_visitor_email", email);

    setChatId(newChatId);
    setShowIntro(false);
  };

  // 5. Typing indicator update
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (isMockMode || !db || !chatId) return;

    // Set typing state to true
    const chatDocRef = doc(db, "chats", chatId);
    setDoc(chatDocRef, { typingVisitor: true }, { merge: true }).catch(console.error);

    // Debounce reset typing state to false
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(chatDocRef, { typingVisitor: false }, { merge: true }).catch(console.error);
    }, 2000);
  };

  // 6. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatId) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSubmitting(true);

    // Optimistic update for immediate response feel
    const optimisticMessage: ChatMessage = {
      id: "opt_" + Date.now(),
      sender: "visitor",
      text: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          text: messageText,
          sender: "visitor",
          name: name || "Anonymous Visitor",
          email: email || "",
        }),
      });

      if (!response.ok) {
        throw new Error("API write failed");
      }

      // If running in local mock mode, trigger a chatbot reply
      if (isMockMode) {
        setTimeout(async () => {
          const botReply = "Thanks for checking out Thusitha's portfolio! 👋 This is an automated reply since Firebase database services are in fallback mode. When configured, Thusitha will get an instant push notification and reply in real time!";

          await fetch("/api/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId,
              text: botReply,
              sender: "admin",
            }),
          });

          // Reload messages
          const res = await fetch(`/api/chat/message?chatId=${chatId}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSubmitting(false);
      // Reset typing state immediately
      if (!isMockMode && db && chatId) {
        const chatDocRef = doc(db, "chats", chatId);
        setDoc(chatDocRef, { typingVisitor: false }, { merge: true }).catch(console.error);
      }
    }
  };

  // Render floating button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-ink-900 shadow-2xl transition-all duration-300 hover:bg-peach-300 hover:scale-110 cursor-pointer"
          aria-label="Open live chat"
        >
          <MessageSquare className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-peach-500 text-[10px] font-bold text-cream-500 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[350px] sm:w-[380px] h-[520px] max-h-[85vh] flex flex-col rounded-2xl bg-ink-800/80 border border-ink-200/18 shadow-2xl backdrop-blur-md overflow-hidden animate-fadeIn select-none">

      {/* Chat Header */}
      <header className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-ink-900/60 to-ink-800/40 border-b border-ink-200/14">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9.5 w-9.5 rounded-full border border-peach-300/30 bg-ink-900/50">
            <img src="/cartoon-wave.png" alt="Thusitha Kithuldora" className="w-full h-full object-contain rounded-full" />
            <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-green-500 border border-ink-900 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold text-cream-100">Thusitha Kithuldora</span>
            <span className="text-[10px] font-mono text-peach-300">
              {isMockMode ? "AI Chatbot Fallback" : "Replies in minutes"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-full text-ink-200 hover:text-cream-100 hover:bg-ink-200/10 transition-all cursor-pointer"
          aria-label="Close chat"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </header>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {showIntro ? (
          /* Intro Form */
          <form onSubmit={handleIntroSubmit} className="flex-1 flex flex-col justify-center gap-4 py-2">
            <div className="text-center mb-2">
              <Sparkles className="h-8 w-8 text-peach-300 mx-auto mb-2 animate-bounce" />
              <h4 className="font-display text-base font-bold text-cream-100">Live Chat</h4>
              <p className="text-xs text-ink-200 px-4 mt-1">
                Have a quick question or request? Start a secure real-time message stream.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 px-2">
              <label htmlFor="chat-name" className="contact-label text-[9px] tracking-wider">Your Name (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  id="chat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="contact-input text-sm py-2"
                />
                <User className="absolute right-2 top-2.5 h-4 w-4 text-ink-300 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 px-2">
              <label htmlFor="chat-email" className="contact-label text-[9px] tracking-wider">Your Email (Optional)</label>
              <div className="relative">
                <input
                  type="email"
                  id="chat-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="contact-input text-sm py-2"
                />
                <Mail className="absolute right-2 top-2.5 h-4 w-4 text-ink-300 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 mx-2 min-h-[40px] rounded-full bg-cream-100 hover:bg-peach-300 text-ink-900 text-sm font-semibold transition-all duration-300 shadow-md cursor-pointer"
            >
              Start Chat
            </button>
          </form>
        ) : (
          /* Conversation Stream */
          <>
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60">
                <MessageSquare className="h-8 w-8 text-ink-300 mb-2" />
                <span className="font-mono text-xs text-ink-200">No messages yet.</span>
                <span className="text-[10px] text-ink-300 mt-1 max-w-[200px]">Send a message to start the conversation!</span>
              </div>
            )}

            {messages.map((msg) => {
              const isVisitor = msg.sender === "visitor";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${isVisitor ? "self-end items-end" : "self-start items-start"
                    } animate-fadeIn`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${isVisitor
                      ? "bg-peach-300 text-ink-900 rounded-tr-none"
                      : "bg-ink-700/60 text-cream-100 border border-ink-200/10 rounded-tl-none"
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

            {/* Admin typing indicator */}
            {typingAdmin && (
              <div className="self-start flex items-center gap-1.5 bg-ink-700/40 border border-ink-200/10 px-3.5 py-2.5 rounded-2xl rounded-tl-none">
                <span className="h-1.5 w-1.5 bg-peach-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 bg-peach-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 bg-peach-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Footer */}
      {!showIntro && (
        <form onSubmit={handleSendMessage} className="p-3 bg-ink-900/40 border-t border-ink-200/14 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isSubmitting}
            className="flex-1 min-h-[36px] bg-ink-800/60 border border-ink-200/14 rounded-full px-4 py-1.5 text-xs text-cream-100 placeholder-ink-300 focus:outline-none focus:border-peach-300 focus:bg-ink-800 transition-all"
          />
          <button
            type="submit"
            disabled={isSubmitting || !inputText.trim()}
            className="h-9 w-9 rounded-full bg-cream-100 hover:bg-peach-300 text-ink-900 flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shrink-0"
            aria-label="Send message"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-ink-900" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}
