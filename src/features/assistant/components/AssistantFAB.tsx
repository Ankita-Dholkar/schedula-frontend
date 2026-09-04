"use client";

import { Bot } from "lucide-react";

interface AssistantFABProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function AssistantFAB({ isOpen, onClick }: AssistantFABProps) {
  return (
    <button
      id="schedula-assistant-fab"
      onClick={onClick}
      aria-label={isOpen ? "Close Schedula Assistant" : "Open Schedula Assistant"}
      aria-expanded={isOpen}
      className={`
        fixed bottom-6 right-6 z-50
        flex h-14 w-14 items-center justify-center
        rounded-full shadow-2xl
        transition-all duration-300 ease-out
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand)]/40
        ${
          isOpen
            ? "bg-[var(--ink)] text-white scale-95"
            : "bg-[var(--brand)] text-white hover:bg-[var(--brand-deep)] hover:scale-110 active:scale-95"
        }
      `}
    >
      {/* Pulse ring when closed */}
      {!isOpen && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-20" />
      )}

      <span
        className={`transition-transform duration-300 ${isOpen ? "rotate-90" : "rotate-0"}`}
      >
        {isOpen ? (
          /* X icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <Bot size={24} strokeWidth={1.8} />
        )}
      </span>
    </button>
  );
}
