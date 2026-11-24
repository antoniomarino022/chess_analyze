"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getBestItalianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const italianVoices = voices.filter((voice) => /^it(?:-|$)/i.test(voice.lang));
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    return (
      (/natural|neural|premium|enhanced|online/.test(name) ? 8 : 0) +
      (/google|microsoft|apple|cosimo|alice/.test(name) ? 4 : 0) +
      (/^it-it$/i.test(voice.lang) ? 2 : 0)
    );
  };

  return italianVoices.reduce<SpeechSynthesisVoice | undefined>((best, voice) => {
    return !best || score(voice) > score(best) ? voice : best;
  }, undefined);
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
}

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sequenceRef = useRef(0);
  const pauseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    const updateVoices = () => {
      voicesRef.current = synth.getVoices();
    };
    synthRef.current = synth;
    updateVoices();
    synth.addEventListener("voiceschanged", updateVoices);

    return () => {
      sequenceRef.current += 1;
      if (pauseTimerRef.current !== null) window.clearTimeout(pauseTimerRef.current);
      synth.removeEventListener("voiceschanged", updateVoices);
      synth.cancel();
      synthRef.current = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    const sentences = splitSentences(text.trim());
    if (!synth || sentences.length === 0) return;

    const sequence = ++sequenceRef.current;
    if (pauseTimerRef.current !== null) window.clearTimeout(pauseTimerRef.current);
    utteranceRef.current = null;
    synth.cancel();

    const availableVoices = synth.getVoices();
    const voice = getBestItalianVoice(availableVoices.length ? availableVoices : voicesRef.current);
    let sentenceIndex = 0;

    const speakNextSentence = () => {
      if (sequence !== sequenceRef.current) return;
      if (sentenceIndex >= sentences.length) {
        utteranceRef.current = null;
        setIsSpeaking(false);
        return;
      }

      const sentence = sentences[sentenceIndex++];
      const isExclamation = /!+$/.test(sentence);
      const isQuestion = /\?+$/.test(sentence);
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = voice?.lang || "it-IT";
      utterance.voice = voice || null;
      utterance.rate = isExclamation ? 1.02 : isQuestion ? 0.95 : 0.97;
      utterance.pitch = isExclamation ? 1.1 : isQuestion ? 1.07 : sentenceIndex % 2 === 0 ? 0.98 : 1.02;
      utteranceRef.current = utterance;
      utterance.onstart = () => {
        if (sequence === sequenceRef.current) setIsSpeaking(true);
      };
      utterance.onend = () => {
        if (sequence !== sequenceRef.current) return;
        pauseTimerRef.current = window.setTimeout(speakNextSentence, 180);
      };
      utterance.onerror = (event) => {
        if (sequence !== sequenceRef.current) return;
        utteranceRef.current = null;
        setIsSpeaking(false);
        console.error("Browser speech synthesis error:", event.error);
      };
      synth.speak(utterance);
    };

    speakNextSentence();
  }, []);

  const stop = useCallback(() => {
    sequenceRef.current += 1;
    if (pauseTimerRef.current !== null) window.clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = null;
    utteranceRef.current = null;
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
