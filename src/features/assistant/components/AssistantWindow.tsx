"use client";

import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Send, Bot, RefreshCw, AlertTriangle } from "lucide-react";
import type { ChatMessage, AssistantRequest } from "@/features/assistant/types";
import {
  PATIENT_SUGGESTED_QUESTIONS,
  DOCTOR_SUGGESTED_QUESTIONS,
} from "@/features/assistant/data/schedula-knowledge";

type AssistantRole = "patient" | "doctor" | "general";

interface AssistantWindowProps {
  role: AssistantRole;
  userName: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getGreeting(role: AssistantRole, pathname: string, userName: string): string {
  const name = userName ? `, ${userName.split(" ")[0]}` : "";
  if (role === "doctor") {
    if (pathname.includes("/dashboard"))
      return `Hi Dr.${name} 👋 I can help you navigate your dashboard or manage today's appointments.`;
    if (pathname.includes("/appointments"))
      return `Hi Dr.${name} 👋 Need help with the calendar or rescheduling appointments?`;
    if (pathname.includes("/prescriptions"))
      return `Hi Dr.${name} 👋 I can guide you through creating or managing prescriptions.`;
    if (pathname.includes("/profile"))
      return `Hi Dr.${name} 👋 I can help you update your profile or manage your availability.`;
    return `Hi Dr.${name} 👋 I'm your Schedula guide. How can I help you today?`;
  } else if (role === "patient") {
    if (pathname.includes("/doctors"))
      return `Hi${name} 👋 Looking for a doctor? I can help you find one and book an appointment.`;
    if (pathname.includes("/appointments"))
      return `Hi${name} 👋 I can help you manage, reschedule, or cancel your appointments.`;
    if (pathname.includes("/profile"))
      return `Hi${name} 👋 I can guide you through updating your profile information.`;
    return `Hi${name} 👋 I'm your Schedula guide. How can I help you today?`;
  } else {
    // General / homepage visitor
    return `Hi there 👋 I'm the Schedula Assistant! I can help you find doctors, book appointments, or guide you if you're a doctor looking to manage your clinic. What can I help you with?`;
  }
}

function getSuggestedQuestions(role: AssistantRole, pathname: string): string[] {
  if (role === "general") {
    return [
      "How do I book an appointment?",
      "How do I register as a doctor?",
      "How do I find a specialist?",
      "What can patients do on Schedula?",
    ];
  }
  const map =
    role === "doctor" ? DOCTOR_SUGGESTED_QUESTIONS : PATIENT_SUGGESTED_QUESTIONS;

  // Find the most specific matching route
  const matchedKey = Object.keys(map)
    .filter((k) => k !== "default" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];

  return map[matchedKey] ?? map["default"] ?? [];
}

/* ── Typing indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]">
        <Bot size={14} className="text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white border border-[var(--line)] px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 rounded-full bg-[var(--muted)] animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Message bubble ─── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
          ${isUser ? "bg-[var(--brand-deep)] text-white" : "bg-[var(--brand)] text-white"}`}
      >
        {isUser ? (
          "Y"
        ) : (
          <Bot size={14} className="text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
          ${
            isUser
              ? "rounded-br-sm bg-[var(--brand)] text-white"
              : "rounded-bl-sm bg-white border border-[var(--line)] text-[var(--ink)]"
          }`}
      >
        {/* Render line breaks from assistant markdown-ish text */}
        {message.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AssistantWindow({ role, userName }: AssistantWindowProps) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions = getSuggestedQuestions(role, pathname);
  const greeting = getGreeting(role, pathname, userName);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when window mounts
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setError(null);

      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload: AssistantRequest = {
        role,
        pathname,
        question: trimmed,
        history: historyPayload,
      };

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Request failed");
        }

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.answer,
          suggestions: data.suggestions,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, pathname, role]
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setMessages((prev) => prev.slice(0, -1)); // remove failed response placeholder if any
      sendMessage(lastUserMsg.content);
    }
  };

  const isEmpty = messages.length === 0;

  const activeSuggestions = isEmpty
    ? suggestedQuestions
    : (!isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant")
    ? (messages[messages.length - 1].suggestions || [])
    : [];

  return (
    <div
      role="dialog"
      aria-label="Schedula Assistant"
      aria-modal="false"
      className="
        fixed bottom-24 right-6 z-50
        w-[360px] sm:w-[400px]
        flex flex-col
        rounded-2xl border border-[var(--line)]
        bg-[var(--canvas)]
        shadow-[0_20px_60px_rgba(0,0,0,0.15)]
        overflow-hidden
        animate-in
      "
      style={{ height: "560px", maxHeight: "calc(100vh - 120px)" }}
    >
      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--brand)] px-4 py-3.5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 shrink-0">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">
            Schedula Assistant
          </p>
          <p className="text-[11px] text-white/70 mt-0.5 capitalize">
            {role === "doctor" ? "Doctor Portal" : role === "patient" ? "Patient Portal" : "Schedula Help"} · Guidance only
          </p>
        </div>
        {/* Online indicator */}
        <span className="flex items-center gap-1.5 text-[11px] text-white/70">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </span>
      </div>

      {/* ── Messages ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
        {/* Greeting / Welcome state */}
        {isEmpty && (
          <div className="mb-5">
            <div className="flex items-end gap-2 mb-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]">
                <Bot size={14} className="text-white" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white border border-[var(--line)] px-4 py-3 text-sm leading-relaxed shadow-sm text-[var(--ink)]">
                {greeting}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error state */}
        {error && !isLoading && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-medium">Couldn&apos;t get a response</p>
              <p className="mt-0.5 text-red-600 opacity-80">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 shrink-0 rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition"
            >
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested question chips ─────────────── */}
      {activeSuggestions.length > 0 && (
        <div className="shrink-0 border-t border-[var(--line)] bg-white/60 px-3 py-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Suggested Questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeSuggestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="rounded-full border border-[var(--brand)]/30 bg-white px-3 py-1 text-xs text-[var(--brand)] font-medium transition hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ───────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[var(--line)] bg-white px-3 py-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 focus-within:border-[var(--brand)] focus-within:ring-1 focus-within:ring-[var(--brand)]/30 transition">
          <input
            ref={inputRef}
            id="assistant-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Schedula…"
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder:text-stone-400 outline-none disabled:opacity-60"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-2 text-center text-[10px] text-[var(--muted)] leading-tight">
          For guidance only · Cannot perform actions · Not medical advice
        </p>
      </form>
    </div>
  );
}
