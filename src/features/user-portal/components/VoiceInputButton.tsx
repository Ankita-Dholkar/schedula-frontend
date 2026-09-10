"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import {
  isSpeechRecognitionSupported,
  createSpeechRecognition,
} from "@/lib/speechRecognition";

type Props = {
  /** Called with finalized speech text only — never called with interim text. */
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

type State = "idle" | "listening" | "unsupported";

export default function VoiceInputButton({ onTranscript, disabled = false }: Props) {
  const [state, setState] = useState<State>(() =>
    isSpeechRecognitionSupported() ? "idle" : "unsupported"
  );
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = () => {
    setError("");
    setInterimText("");

    const recognition = createSpeechRecognition({
      onResult: (transcript) => {
        // Final result only → pass to parent to append
        onTranscript(transcript);
        setInterimText("");
      },
      onInterimResult: (transcript) => {
        // Preview only — never passed to parent
        setInterimText(transcript);
      },
      onEnd: () => {
        setState("idle");
        setInterimText("");
      },
      onError: (errMsg) => {
        setState("idle");
        setInterimText("");
        setError(errMsg);
      },
    });

    if (!recognition) {
      setState("unsupported");
      return;
    }

    recognitionRef.current = recognition;
    recognition.start();
    setState("listening");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setState("idle");
    setInterimText("");
  };

  if (state === "unsupported") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled
          title="Voice input isn't supported in this browser."
          className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-400"
        >
          <MicOff size={16} />
        </button>
        <p className="text-[11px] text-stone-400">Voice unavailable</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {state === "idle" ? (
        <button
          type="button"
          onClick={startListening}
          disabled={disabled}
          title="Click to speak your symptoms"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--brand)] text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mic size={16} />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={stopListening}
            title="Click to stop listening"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white shadow-md transition hover:bg-red-600"
          >
            {/* Pulsing ring animation */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-red-400 opacity-50" />
            <Square size={13} fill="white" />
          </button>
          <p
            className="cursor-pointer text-[11px] font-medium text-red-500 hover:underline"
            onClick={stopListening}
          >
            Tap to stop
          </p>
        </>
      )}

      {/* Live interim text preview */}
      {interimText && (
        <p className="max-w-[220px] text-right text-xs italic text-[var(--muted)]">
          🎤 &ldquo;{interimText}&rdquo;
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="max-w-[220px] text-right text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}
