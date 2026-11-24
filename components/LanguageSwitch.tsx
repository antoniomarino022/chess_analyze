"use client";

import { messages } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  const label = messages[language].changeLanguage;

  return (
    <div className="flex items-center rounded-lg border border-[#665039] bg-[#211b15]/80 p-0.5" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => setLanguage("it")}
        aria-label="Italiano"
        aria-pressed={language === "it"}
        className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${language === "it" ? "bg-[#665033] text-[#fff5df]" : "text-[#aaa294] hover:text-white"}`}
      >
        IT
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-label="English"
        aria-pressed={language === "en"}
        className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${language === "en" ? "bg-[#665033] text-[#fff5df]" : "text-[#aaa294] hover:text-white"}`}
      >
        EN
      </button>
    </div>
  );
}
