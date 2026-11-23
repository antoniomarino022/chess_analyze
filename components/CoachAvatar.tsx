"use client";

import React from "react";
import type { CoachMood } from "@/types";

interface CoachAvatarProps {
  mood: CoachMood;
  isSpeaking: boolean;
  name?: string;
}

export function CoachAvatar({
  mood,
  isSpeaking,
  name = "Maestro Denis",
}: CoachAvatarProps) {
  // Configurazione espressione facciale dinamica stile Chess.com Game Review
  const moodConfig: Record<
    CoachMood,
    { label: string; eyebrowD: string; mouthD: string; eyeY: number; bgAccent: string }
  > = {
    // Orgoglioso / Brillante
    proud: {
      label: "Impressionato",
      eyebrowD: "M 18 29 Q 24 24 30 28 M 50 28 Q 56 24 62 29",
      mouthD: "M 28 58 Q 40 70 52 58",
      eyeY: 34,
      bgAccent: "from-cyan-500/20 to-emerald-500/10 border-cyan-500/40",
    },
    // Felice / Mossa migliore
    happy: {
      label: "Soddisfatto",
      eyebrowD: "M 20 28 Q 25 24 30 27 M 50 27 Q 55 24 60 28",
      mouthD: "M 30 57 Q 40 67 50 57",
      eyeY: 34,
      bgAccent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/40",
    },
    // Neutro / Mossa da libro o buona
    neutral: {
      label: "Attento",
      eyebrowD: "M 20 28 L 30 28 M 50 28 L 60 28",
      mouthD: "M 32 59 Q 40 60 48 59",
      eyeY: 35,
      bgAccent: "from-zinc-800 to-zinc-900 border-zinc-700",
    },
    // Inesattezza / Pensieroso
    thinking: {
      label: "Perplesso",
      eyebrowD: "M 20 26 Q 25 29 30 28 M 50 26 Q 55 23 60 27",
      mouthD: "M 33 60 Q 40 56 47 60",
      eyeY: 35,
      bgAccent: "from-yellow-500/20 to-amber-500/10 border-yellow-500/40",
    },
    // Errore / Blunder / Shock
    shocked: {
      label: "Inorridito (Blunder!)",
      eyebrowD: "M 18 24 Q 24 29 30 31 M 50 31 Q 56 29 62 24",
      mouthD: "M 33 56 A 7 9 0 0 0 47 56 A 7 9 0 0 0 33 56",
      eyeY: 36,
      bgAccent: "from-red-500/20 to-rose-500/10 border-red-500/40",
    },
  };

  const current = moodConfig[mood] || moodConfig.neutral;

  return (
    <div
      className={`flex items-center gap-3.5 p-3 rounded-2xl border bg-gradient-to-br transition-all duration-300 shadow-md ${current.bgAccent}`}
    >
      {/* Avatar Rotondo Stile Chess.com Game Review */}
      <div className="relative shrink-0">
        <div
          className={`w-14 h-14 rounded-full overflow-hidden border-2 bg-[#2b2b2b] flex items-center justify-center transition-all ${
            isSpeaking
              ? "border-emerald-400 ring-4 ring-emerald-500/30 scale-105"
              : "border-zinc-600"
          }`}
        >
          <svg viewBox="0 0 80 80" className="w-full h-full">
            {/* Sfondo cerchio testa */}
            <circle cx="40" cy="40" r="38" fill="#e8c89b" />

            {/* Capelli / Berretto da coach scacchi */}
            <path
              d="M 12 30 Q 40 8 68 30 Q 64 16 40 14 Q 16 16 12 30 Z"
              fill="#2d3748"
            />
            {/* Baffi da Maestro di Scacchi */}
            <path
              d="M 28 52 Q 40 55 40 51 Q 40 55 52 52 Q 45 48 40 50 Q 35 48 28 52 Z"
              fill="#2d3748"
            />

            {/* Sopracciglia dinamiche */}
            <path
              d={current.eyebrowD}
              stroke="#2d3748"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-300"
            />

            {/* Occhi con riflesso */}
            <circle cx="25" cy={current.eyeY} r="3.5" fill="#1a202c" />
            <circle cx="26" cy={current.eyeY - 1} r="1" fill="#ffffff" />
            <circle cx="55" cy={current.eyeY} r="3.5" fill="#1a202c" />
            <circle cx="56" cy={current.eyeY - 1} r="1" fill="#ffffff" />

            {/* Occhiali tondi da coach */}
            <circle
              cx="25"
              cy={current.eyeY}
              r="7.5"
              stroke="#4a5568"
              strokeWidth="1.8"
              fill="none"
            />
            <circle
              cx="55"
              cy={current.eyeY}
              r="7.5"
              stroke="#4a5568"
              strokeWidth="1.8"
              fill="none"
            />
            <path d="M 32.5 35 L 47.5 35" stroke="#4a5568" strokeWidth="1.8" />

            {/* Bocca animata (apertura se sta parlando) */}
            <path
              d={isSpeaking ? "M 32 58 Q 40 70 48 58 Q 40 64 32 58" : current.mouthD}
              stroke="#9b2c2c"
              strokeWidth={isSpeaking ? "1.5" : "3"}
              strokeLinecap="round"
              fill={isSpeaking ? "#742a2a" : "none"}
              className={`transition-all duration-150 ${isSpeaking ? "animate-pulse" : ""}`}
            />
          </svg>
        </div>

        {/* Indicatore "Sta Parlando" ad onde sonore */}
        {isSpeaking && (
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-zinc-950 items-center justify-center text-[8px] text-white">
              ▲
            </span>
          </span>
        )}
      </div>

      {/* Dettaglio Coach e Mood */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-100">{name}</span>
          <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60 font-medium">
            AI Coach
          </span>
        </div>
        <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{current.label}</span>
          {isSpeaking && <span className="text-emerald-400 font-semibold">• Parlando...</span>}
        </div>
      </div>
    </div>
  );
}
