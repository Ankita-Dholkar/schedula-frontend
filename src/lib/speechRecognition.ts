/**
 * speechRecognition.ts
 * Lightweight client-side wrapper for the Web Speech API.
 * Only call these functions inside useEffect / event handlers (browser-only).
 * Types are declared in src/types/web-speech-api.d.ts
 */

export type SpeechRecognitionCallbacks = {
  /** Called only when a recognition result is finalized — append to textarea. */
  onResult: (transcript: string) => void;
  /** Called for interim results — preview only, never appended to the field. */
  onInterimResult?: (transcript: string) => void;
  /** Called when the recognition session ends naturally or is stopped. */
  onEnd?: () => void;
  /** Called on permission denial or recognition failure. */
  onError?: (error: string) => void;
};

/** Returns true if the current browser supports the Web Speech API. */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Creates and returns a configured SpeechRecognition instance.
 * Call `.start()` on the returned object to begin listening.
 */
export function createSpeechRecognition(
  callbacks: SpeechRecognitionCallbacks
): SpeechRecognition | null {
  if (!isSpeechRecognitionSupported()) return null;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();

  recognition.lang = "en-US";
  recognition.interimResults = true; // enables live feedback
  recognition.continuous = false;    // short session, ends after natural pause

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    // Interim: visual preview only
    if (interimTranscript && callbacks.onInterimResult) {
      callbacks.onInterimResult(interimTranscript);
    }

    // Final: append to textarea via parent callback
    if (finalTranscript) {
      callbacks.onResult(finalTranscript.trim());
    }
  };

  recognition.onend = () => {
    callbacks.onEnd?.();
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const msg =
      event.error === "not-allowed"
        ? "Microphone permission was denied."
        : event.error === "no-speech"
        ? "No speech was detected. Please try again."
        : `Recognition error: ${event.error}`;
    callbacks.onError?.(msg);
  };

  return recognition;
}
