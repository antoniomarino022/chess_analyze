"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      setSupported(true);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current || !text) return;

      // Interrompe eventuale discorso precedente
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "it-IT";
      utterance.rate = 1.05; // ritmo leggermente brillante
      utterance.pitch = 1.0;

      // Cerca una voce italiana naturale se disponibile nel sistema
      const voices = synthRef.current.getVoices();
      const italianVoice = voices.find(
        (v) => v.lang.startsWith("it") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Cosimo") || v.name.includes("Alice"))
      ) || voices.find((v) => v.lang.startsWith("it"));

      if (italianVoice) {
        utterance.voice = italianVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    []
  );

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking, supported };
}
