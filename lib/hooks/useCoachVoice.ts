"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useCoachVoice(language: "it" | "en" = "it") {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      audioCacheRef.current.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      audioCacheRef.current.clear();
    };
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceEnabled || !text.trim()) return;

      stop();

      const cleanText = text
        .replace(/[☠★•≠×▲✓!]+/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) return;

      const cacheKey = `${language}:${cleanText}`;
      let audioUrl = audioCacheRef.current.get(cacheKey);

      try {
        if (!audioUrl) {
          const controller = new AbortController();
          abortControllerRef.current = controller;

          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleanText, language }),
            signal: controller.signal,
          });

          if (!res.ok) {
            throw new Error(`Errore API TTS: ${res.statusText}`);
          }

          const blob = await res.blob();
          audioUrl = URL.createObjectURL(blob);
          audioCacheRef.current.set(cacheKey, audioUrl);
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);

        await audio.play();
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Errore riproduzione voce neurale:", err);
        }
        setIsSpeaking(false);
      }
    },
    [voiceEnabled, language, stop]
  );

  return {
    voiceEnabled,
    setVoiceEnabled,
    isSpeaking,
    speak,
    stop,
  };
}
