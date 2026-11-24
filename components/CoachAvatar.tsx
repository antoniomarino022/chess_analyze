"use client";

import type { CoachAvatarProps, CoachMood } from "@/types";
import { messages } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";

const moodConfig: Record<CoachMood, { brow: string; mouth: string; eyeY: number; accent: string }> = {
  proud: { brow: "M 19 28 Q 24 23 30 27 M 50 27 Q 56 23 61 28", mouth: "M 29 56 Q 40 68 51 56", eyeY: 35, accent: "text-amber-200" },
  happy: { brow: "M 19 28 Q 24 24 30 27 M 50 27 Q 56 24 61 28", mouth: "M 30 56 Q 40 66 50 56", eyeY: 35, accent: "text-amber-200" },
  neutral: { brow: "M 19 28 L 30 28 M 50 28 L 61 28", mouth: "M 32 58 Q 40 59 48 58", eyeY: 36, accent: "text-stone-200" },
  thinking: { brow: "M 19 27 Q 24 30 30 28 M 50 26 Q 56 23 61 27", mouth: "M 33 59 Q 40 55 47 59", eyeY: 36, accent: "text-yellow-200" },
  shocked: { brow: "M 19 24 Q 24 29 30 31 M 50 31 Q 56 29 61 24", mouth: "M 34 55 A 6 8 0 1 0 46 55 A 6 8 0 1 0 34 55", eyeY: 37, accent: "text-rose-200" },
};

export function CoachAvatar({
  mood,
  name,
  voiceEnabled,
  isSpeaking,
  onToggleVoice,
}: CoachAvatarProps) {
  const { language } = useLanguage();
  const current = moodConfig[mood] ?? moodConfig.neutral;
  const text = messages[language].replay;
  const displayName = name ?? (language === "it" ? "Maestro Alfonso" : "Master Alfonso");

  return (
    <div className="coach-card group flex items-center justify-between gap-4 rounded-2xl border border-[#5d4932] bg-[#211b15] p-3.5 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-[#b88a4a]">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative shrink-0">
          <div className="coach-avatar h-[68px] w-[68px] overflow-hidden rounded-full border-[3px] border-[#c7a56b] bg-[#dfc79e] shadow-[0_0_0_4px_#392d20] transition duration-300 group-hover:rotate-2">
            <svg viewBox="0 0 80 80" role="img" aria-label={text.portrait(displayName)} className="h-full w-full">
              <defs>
                <linearGradient id="portrait" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f1dfbf"/><stop offset="1" stopColor="#caa879"/></linearGradient>
              </defs>
              <circle cx="40" cy="40" r="40" fill="url(#portrait)"/>
              <path d="M8 80 Q12 61 29 59 L40 69 51 59 Q69 61 73 80" fill="#315640"/>
              <path d="M33 54h14v12l-7 5-7-5z" fill="#c59463"/>
              <path d="M18 34 Q18 12 40 12 Q62 12 62 35 L58 51 Q52 62 40 63 Q28 62 22 51z" fill="#e8c69c"/>
              <path d="M17 34 Q16 12 40 11 Q64 12 63 35 L57 29 Q48 31 39 24 Q31 31 21 30z" fill="#423627"/>
              <path d="M19 31 Q40 23 61 31" fill="none" stroke="#9a7546" strokeWidth="3"/>
              <path d={current.brow} stroke="#543c2b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <ellipse cx="25" cy={current.eyeY} rx="3" ry="3.5" fill="#372b24"/><ellipse cx="55" cy={current.eyeY} rx="3" ry="3.5" fill="#372b24"/>
              <circle cx="25" cy={current.eyeY} r="7" fill="none" stroke="#69543a" strokeWidth="1.5"/><circle cx="55" cy={current.eyeY} r="7" fill="none" stroke="#69543a" strokeWidth="1.5"/><path d="M32 36h16" stroke="#69543a" strokeWidth="1.5"/>
              <path d="M38 39 Q35 48 40 49" fill="none" stroke="#b07f58" strokeWidth="2" strokeLinecap="round"/>
              <path d="M28 51 Q34 48 40 51 Q46 48 52 51 Q48 59 40 58 Q32 59 28 51" fill="#493329"/>
              <path d={current.mouth} stroke="#8f493d" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M18 37h-3M65 37h-3" stroke="#ad824b" strokeWidth="2"/>
            </svg>
          </div>
          <span
            role="status"
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#211b15] transition-colors ${
              isSpeaking ? "bg-[#52c41a] animate-pulse" : "bg-[#78836b]"
            }`}
            aria-label={text.coachReady}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#f4ead8] truncate">{displayName}</span>
            <span className="rounded-full border border-[#665039] bg-[#382a1d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d8b77c]">{text.coach}</span>
          </div>
          <div className={`mt-1 flex items-center gap-2 text-xs ${current.accent}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#ba965d]" />
            <span>{text.mood[mood]}</span>
          </div>
        </div>
      </div>

      {/* Tasto Attiva/Disattiva Voce Neurale ben visibile sempre */}
      {onToggleVoice && (
        <button
          onClick={onToggleVoice}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
            voiceEnabled
              ? "border-[#85a85c] bg-[#354f2c] text-[#def0cd] shadow-md shadow-black/20 ring-1 ring-[#85a85c]/40"
              : "border-[#534331] bg-[#1a1612] text-[#b3a896] hover:border-[#826a4c] hover:text-[#f4ead8]"
          }`}
          title={voiceEnabled ? "Disattiva voce coach" : "Attiva voce coach neurale"}
          aria-label={voiceEnabled ? "Disattiva voce coach" : "Attiva voce coach neurale"}
        >
          <span className="text-base leading-none">{voiceEnabled ? (isSpeaking ? "🔊" : "🔉") : "🔇"}</span>
          <span className="inline text-[11px] font-bold">
            {voiceEnabled
              ? language === "it"
                ? "Voce ON"
                : "Voice ON"
              : language === "it"
              ? "Attiva Voce"
              : "Enable Voice"}
          </span>
        </button>
      )}
    </div>
  );
}
