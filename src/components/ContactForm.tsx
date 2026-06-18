"use client";

import React, { useState } from "react";
import { z } from "zod";
import confetti from "canvas-confetti";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type FormFields = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const [fields, setFields] = useState<FormFields>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (errors[name as keyof FormFields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrors({});
    setErrorMessage("");

    // Client-side Zod validation check
    const validationResult = contactFormSchema.safeParse(fields);
    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof FormFields, string>> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof FormFields] = err.message;
        }
      });
      setErrors(fieldErrors);
      setStatus("idle");
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrorMessage(data.message || "Something went wrong.");
        }
        setStatus("error");
        return;
      }

      setStatus("success");
      setFields({ name: "", email: "", message: "" });

      // Celebrate with premium confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#dec5ab", "#c9a589", "#8fa2ff", "#f5f1e8"],
      });
    } catch {
      setErrorMessage("Could not connect to server. Please check your internet connection.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-panel-bg border border-panel-border rounded-2xl shadow-xl backdrop-blur-md transition-all animate-fadeIn">
        <CheckCircle2 className="h-14 w-14 text-peach-300 mb-4 animate-bounce" />
        <h3 className="font-display text-2xl font-bold text-cream-100 mb-2">Message Sent!</h3>
        <p className="text-sm text-ink-200 max-w-sm mb-6">
          Thank you for reaching out, Thusitha. Your submission was received and recorded. He will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="px-6 py-2.5 rounded-full bg-cream-100 hover:bg-peach-300 text-ink-900 text-sm font-medium transition-all duration-300 shadow-lg cursor-pointer"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 p-6 md:p-8 bg-panel-bg border border-panel-border rounded-2xl shadow-xl backdrop-blur-md"
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-semibold text-cream-100">Drop a Message</h3>
        <p className="text-xs text-ink-200">Have a project, job opening, or idea? Let&apos;s build it together.</p>
      </div>

      {status === "error" && errorMessage && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Name Input */}
      <div className="flex flex-col gap-1 relative">
        <label htmlFor="name" className="contact-label">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={fields.name}
          onChange={handleChange}
          disabled={status === "submitting"}
          placeholder="e.g. John Doe"
          className="contact-input"
          required
        />
        {errors.name && (
          <span className="text-[10px] text-red-400 font-mono tracking-tight flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" /> {errors.name}
          </span>
        )}
      </div>

      {/* Email Input */}
      <div className="flex flex-col gap-1 relative">
        <label htmlFor="email" className="contact-label">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={fields.email}
          onChange={handleChange}
          disabled={status === "submitting"}
          placeholder="e.g. john@example.com"
          className="contact-input"
          required
        />
        {errors.email && (
          <span className="text-[10px] text-red-400 font-mono tracking-tight flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" /> {errors.email}
          </span>
        )}
      </div>

      {/* Message Input */}
      <div className="flex flex-col gap-1 relative">
        <label htmlFor="message" className="contact-label">
          Your Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={fields.message}
          onChange={handleChange}
          disabled={status === "submitting"}
          placeholder="Tell me about your project, goals, or requirements..."
          className="contact-input resize-none"
          required
        />
        {errors.message && (
          <span className="text-[10px] text-red-400 font-mono tracking-tight flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" /> {errors.message}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="group relative flex min-h-[44px] w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-cream-100 px-6 py-2.5 text-sm font-medium text-ink-900 shadow-md transition-all duration-300 hover:bg-peach-300 disabled:opacity-50 cursor-pointer"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-ink-900" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <span>Send Message</span>
            <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
