"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChessBoardView } from "./ChessBoardView";
import { CoachAvatar } from "./CoachAvatar";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "./LanguageProvider";
import { messages } from "@/lib/i18n";
import type { AnalyzedMove, CoachMood, GameReplayModalProps, MoveClassification } from "@/types";

const CLASSIFICATION_CONFIG: Record<MoveClassification, { badgeColor: string; icon: string }> = {
  brilliant: { badgeColor: "bg-[#596e4b]/30 text-[#d4dfb9] border-[#78905f]/50", icon: "!!" },
  great: { badgeColor: "bg-[#4c6650]/35 text-[#d4dfb9] border-[#718866]/50", icon: "!" },
  best: { badgeColor: "bg-[#46714e]/30 text-[#c6d9ad] border-[#6e9467]/50", icon: "★" },
  book: { badgeColor: "bg-[#8a6836]/25 text-[#e6cd98] border-[#a5834d]/50", icon: "▤" },
  excellent: { badgeColor: "bg-[#416e5e]/30 text-[#c6d9ad] border-[#6d9381]/50", icon: "✓" },
  good: { badgeColor: "bg-[#4c6650]/35 text-[#d4dfb9] border-[#718866]/50", icon: "•" },
  inaccuracy: { badgeColor: "bg-[#80692f]/25 text-[#e2cf8d] border-[#a28c50]/50", icon: "▲" },
  mistake: { badgeColor: "bg-[#875a32]/25 text-[#e5b779] border-[#a67648]/50", icon: "×" },
  blunder: { badgeColor: "bg-[#86463d]/25 text-[#e5aaa0] border-[#a9685b]/50", icon: "☠" },
  missed_win: { badgeColor: "bg-[#825049]/25 text-[#e2b6a7] border-[#a97262]/50", icon: "≠" },
};

export function GameReplayModal({ game, analysis, onClose }: GameReplayModalProps) {
  const { language } = useLanguage();
  const text = messages[language].replay;
  const moves: AnalyzedMove[] = Array.isArray(analysis.movesData)
    ? analysis.movesData as AnalyzedMove[]
    : [];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentStep((prev) => Math.min(moves.length, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Home") {
        setCurrentStep(0);
      } else if (e.key === "End") {
        setCurrentStep(moves.length);
      } else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moves.length, onClose]);

  const currentMove = currentStep > 0 ? moves[currentStep - 1] : null;
  const currentFen = currentMove?.fenAfter || moves[0]?.fenBefore || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const classification = currentMove?.classification;
  const moveConfig = classification ? CLASSIFICATION_CONFIG[classification] : null;
  const moveText = classification ? text.classification[classification] : null;
  const coachComment = currentMove ? moveText?.comment || text.moveRecorded : "";
  const coachMood: CoachMood = useMemo(() => {
    if (!classification) return "neutral";
    if (classification === "brilliant") return "proud";
    if (classification === "best" || classification === "great" || classification === "excellent") return "happy";
    if (classification === "inaccuracy") return "thinking";
    if (classification === "mistake" || classification === "blunder" || classification === "missed_win") return "shocked";
    return "neutral";
  }, [classification]);

  const moveButton = "flex h-12 min-w-12 items-center justify-center gap-1 rounded-xl border border-[#665238] bg-[#403321] px-3 text-xs font-bold text-[#f0dfbd] transition hover:bg-[#59452b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#100e0b]/85 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[1.75rem] border border-[#665238] bg-[#211c16] shadow-2xl shadow-black/50 sm:max-h-[92vh] sm:rounded-[1.75rem]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4b3c29] bg-[#171511]/65 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#f0e8d9] sm:text-lg"><span className="text-[#c5a367]">♞</span><span className="truncate">{game.whitePlayer || text.white} {messages[language].home.versus} {game.blackPlayer || text.black}</span></h2>
            <p className="mt-1 text-[11px] text-[#aaa294] sm:text-xs">{game.result || messages[language].home.unknown}<span className="mx-2 text-[#655a49]">·</span>{text.accuracy}: <span className="font-semibold text-[#e5d0a6]">{analysis.whiteAccuracy}% ({text.white.slice(0, 1)})</span> vs <span className="font-semibold text-[#b8c99a]">{analysis.blackAccuracy}% ({text.black.slice(0, 1)})</span></p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch/>
            <button onClick={onClose} className="min-h-10 rounded-xl border border-[#514432] bg-[#30271c] px-3 py-2 text-xs font-semibold text-[#e0d4c0] transition hover:border-[#a37a42] hover:bg-[#3c3021]">{text.close} <span aria-hidden="true">×</span></button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-3 sm:gap-6 sm:p-5 md:grid-cols-12 md:p-6">
          <section className="flex min-w-0 flex-col items-center justify-start gap-3 sm:gap-4 md:col-span-7 md:justify-center" aria-label={text.boardAndControls}>
            <ChessBoardView fen={currentFen} lastMoveUci={currentMove?.uci}/>
            <nav className="flex w-full max-w-[440px] items-center justify-between gap-1 rounded-2xl border border-[#4b3c29] bg-[#171511]/75 p-1.5 sm:justify-center sm:gap-2 sm:p-2" aria-label={text.moveNavigation}>
              <button onClick={() => setCurrentStep(0)} disabled={currentStep === 0} className="grid h-12 min-w-12 place-items-center rounded-xl bg-[#30271c] px-2 text-base text-[#e4d4b7] transition hover:bg-[#493a27] disabled:cursor-not-allowed disabled:opacity-30" title={text.startGame} aria-label={text.startGame}>«</button>
              <button onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))} disabled={currentStep === 0} className={moveButton} title={text.previousMove} aria-label={text.previousMove}><span aria-hidden="true">←</span><span className="hidden sm:inline">{text.previous}</span></button>
              <span role="status" aria-live="polite" aria-label={text.moveProgress(currentStep, moves.length)} className="whitespace-nowrap px-1 text-[10px] font-mono font-semibold text-[#d9c8a9] sm:px-3 sm:text-xs">{currentStep} / {moves.length}</span>
              <button onClick={() => setCurrentStep((prev) => Math.min(moves.length, prev + 1))} disabled={currentStep === moves.length} className={moveButton} title={text.nextMove} aria-label={text.nextMove}><span className="hidden sm:inline">{text.next}</span><span aria-hidden="true">→</span></button>
              <button onClick={() => setCurrentStep(moves.length)} disabled={currentStep === moves.length} className="grid h-12 min-w-12 place-items-center rounded-xl bg-[#30271c] px-2 text-base text-[#e4d4b7] transition hover:bg-[#493a27] disabled:cursor-not-allowed disabled:opacity-30" title={text.endGame} aria-label={text.endGame}>»</button>
            </nav>
            <p className="text-center text-[10px] text-[#898171] sm:text-[11px]">{text.keyboardHelp}</p>
          </section>

          <section className="flex min-w-0 flex-col gap-3 sm:gap-4 md:col-span-5" aria-label={text.commentsAndMoves}>
            <CoachAvatar mood={coachMood}/>
            {currentMove ? <div className="space-y-3 rounded-2xl border border-[#4b3c29] bg-[#171511]/75 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="text-xs font-bold text-[#e6d9c3] sm:text-sm">{text.move} {currentMove.moveNumber} ({currentMove.color === "white" ? text.white : text.black}):</span><span className="font-mono text-lg font-extrabold text-[#f4eee2]">{currentMove.san}</span></div>{moveConfig && moveText && <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${moveConfig.badgeColor}`}><span>{moveConfig.icon}</span><span>{moveText.label}</span></span>}</div>
              <div className="space-y-2 rounded-xl border border-[#453a2a] bg-[#252018] p-3 text-xs leading-relaxed text-[#c7beae] sm:p-3.5"><div className="flex items-center gap-1.5 font-semibold text-[#c8d9a9]"><span>♞</span> {text.coach}:</div><p className="italic text-[#eee4d2]">{coachComment}</p></div>
              {classification !== "best" && currentMove.bestMove && <div className="flex items-center justify-between gap-3 rounded-xl border border-[#55704b]/50 bg-[#315640]/20 p-2.5 text-xs text-[#b8b09e]"><span>{text.recommendedMove}</span><span className="font-mono font-bold text-[#c6d9ad]">{currentMove.bestMove}</span></div>}
            </div> : <div className="rounded-2xl border border-[#4b3c29] bg-[#171511]/75 px-4 py-6 text-center text-xs text-[#aaa294]">{text.startingPosition} <strong className="text-[#e6d4b5]">{text.pressNext} {text.next} ›</strong> {text.toSeeFirstMove}</div>}

            <div className="max-h-52 flex-1 overflow-y-auto rounded-2xl border border-[#4b3c29] bg-[#171511]/75 p-3 sm:max-h-72">
              <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#ba965d] sm:text-xs">{text.moveSequence}</h3>
              <div className="space-y-1 font-mono text-xs">{Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => {
                const whiteMove = moves[i * 2]; const blackMove = moves[i * 2 + 1]; const whiteIdx = i * 2 + 1; const blackIdx = i * 2 + 2;
                return <div key={i} className="grid grid-cols-12 items-center rounded-lg px-2 py-1 text-[#c9c0b1] transition hover:bg-[#282218]"><span className="col-span-2 font-sans font-semibold text-[#857a68]">{i + 1}.</span>
                  {whiteMove && <button onClick={() => setCurrentStep(whiteIdx)} aria-current={currentStep === whiteIdx ? "step" : undefined} className={`col-span-5 min-h-9 rounded-lg px-2 text-left transition ${currentStep === whiteIdx ? "bg-[#665033]/55 font-bold text-[#fff5df]" : "hover:bg-[#30271c] hover:text-white"}`}>{whiteMove.san} <span className="text-[10px] opacity-75">{whiteMove.classification ? CLASSIFICATION_CONFIG[whiteMove.classification]?.icon : ""}</span></button>}
                  {blackMove && <button onClick={() => setCurrentStep(blackIdx)} aria-current={currentStep === blackIdx ? "step" : undefined} className={`col-span-5 min-h-9 rounded-lg px-2 text-left transition ${currentStep === blackIdx ? "bg-[#665033]/55 font-bold text-[#fff5df]" : "hover:bg-[#30271c] hover:text-white"}`}>{blackMove.san} <span className="text-[10px] opacity-75">{blackMove.classification ? CLASSIFICATION_CONFIG[blackMove.classification]?.icon : ""}</span></button>}
                </div>;
              })}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
