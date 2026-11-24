"use client";

import React, { useState, useEffect } from "react";
import { ChessBoardView } from "./ChessBoardView";
import { CoachAvatar } from "./CoachAvatar";
import { generateCoachComment } from "@/actions/coach";
import { useTextToSpeech } from "@/lib/speech";
import type { Game, Analysis, AnalyzedMove, MoveClassification, CoachMood } from "@/types";

interface GameReplayModalProps { game: Game; analysis: Analysis; onClose: () => void }

const CLASSIFICATION_CONFIG: Record<MoveClassification, { label: string; badgeColor: string; icon: string; coachComment: string }> = {
  brilliant: { label: "Brillante", badgeColor: "bg-[#596e4b]/30 text-[#d4dfb9] border-[#78905f]/50", icon: "!!", coachComment: "Mossa geniale! Un sacrificio o una manovra tattica eccezionale." },
  great: { label: "Ottima", badgeColor: "bg-[#4c6650]/35 text-[#d4dfb9] border-[#718866]/50", icon: "!", coachComment: "Mossa fondamentale per mantenere il vantaggio nella posizione." },
  best: { label: "Migliore", badgeColor: "bg-[#46714e]/30 text-[#c6d9ad] border-[#6e9467]/50", icon: "★", coachComment: "Ottima mossa! È esattamente la mossa raccomandata da Stockfish." },
  book: { label: "Libro", badgeColor: "bg-[#8a6836]/25 text-[#e6cd98] border-[#a5834d]/50", icon: "▤", coachComment: "Mossa standard di apertura (teoria di libro)." },
  excellent: { label: "Eccellente", badgeColor: "bg-[#416e5e]/30 text-[#c6d9ad] border-[#6d9381]/50", icon: "✓", coachComment: "Mossa molto solida e precisa. Mantiene tutto il vantaggio." },
  good: { label: "Buona", badgeColor: "bg-[#4c6650]/35 text-[#d4dfb9] border-[#718866]/50", icon: "•", coachComment: "Una mossa naturale e giocabile, anche se c'era qualcosa di leggermente più incisivo." },
  inaccuracy: { label: "Inesattezza", badgeColor: "bg-[#80692f]/25 text-[#e2cf8d] border-[#a28c50]/50", icon: "▲", coachComment: "Non è un vero errore, ma cede una porzione di iniziativa all'avversario." },
  mistake: { label: "Errore", badgeColor: "bg-[#875a32]/25 text-[#e5b779] border-[#a67648]/50", icon: "×", coachComment: "Errore tattico o posizionale. L'avversario può approfittarne per ribaltare l'equilibrio." },
  blunder: { label: "Grave Errore (Blunder)", badgeColor: "bg-[#86463d]/25 text-[#e5aaa0] border-[#a9685b]/50", icon: "☠", coachComment: "Errore decisivo (svista grave). Perde materiale netto o compromette la partita." },
  missed_win: { label: "Vittoria Mancata", badgeColor: "bg-[#825049]/25 text-[#e2b6a7] border-[#a97262]/50", icon: "≠", coachComment: "C'era una combinazione vincente forzata che non è stata colta." },
};

export function GameReplayModal({ game, analysis, onClose }: GameReplayModalProps) {
  const moves: AnalyzedMove[] = (analysis.movesData as any) || [];
  const [currentStep, setCurrentStep] = useState(0);
  const [coachComment, setCoachComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const { speak, stop, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrentStep((prev) => Math.min(moves.length, prev + 1));
      else if (e.key === "ArrowLeft") setCurrentStep((prev) => Math.max(0, prev - 1));
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moves.length, onClose]);

  const currentMove: AnalyzedMove | null = currentStep > 0 ? moves[currentStep - 1] : null;
  const currentFen = currentMove?.fenAfter || moves[0]?.fenBefore || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const moveConfig = currentMove?.classification ? CLASSIFICATION_CONFIG[currentMove.classification] : null;
  const coachMood: CoachMood = React.useMemo(() => {
    if (!currentMove?.classification) return "neutral";
    const c = currentMove.classification;
    if (c === "brilliant") return "proud";
    if (c === "best" || c === "great" || c === "excellent") return "happy";
    if (c === "inaccuracy") return "thinking";
    if (c === "mistake" || c === "blunder" || c === "missed_win") return "shocked";
    return "neutral";
  }, [currentMove]);

  useEffect(() => {
    if (!currentMove) { setCoachComment(""); stop(); return; }
    let isMounted = true;
    setLoadingComment(true);
    generateCoachComment({ move: currentMove, whitePlayer: game.whitePlayer, blackPlayer: game.blackPlayer })
      .then((comment) => {
        if (!isMounted) return;
        setCoachComment(comment); setLoadingComment(false);
        if (autoVoice) speak(comment);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Coach error:", err);
        setCoachComment(moveConfig?.coachComment || "Mossa registrata."); setLoadingComment(false);
      });
    return () => { isMounted = false; stop(); };
  }, [currentStep, autoVoice, currentMove, game.whitePlayer, game.blackPlayer, moveConfig?.coachComment, speak, stop]);

  const moveButton = "h-10 rounded-xl bg-[#30271c] px-2 text-[11px] font-semibold text-[#e4d4b7] transition hover:bg-[#493a27] disabled:cursor-default disabled:opacity-30 sm:px-4 sm:text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#100e0b]/85 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[1.75rem] border border-[#665238] bg-[#211c16] shadow-2xl shadow-black/50 sm:max-h-[92vh] sm:rounded-[1.75rem]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4b3c29] bg-[#171511]/65 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#f0e8d9] sm:text-lg"><span className="text-[#c5a367]">♞</span><span className="truncate">{game.whitePlayer || "Bianco"} vs {game.blackPlayer || "Nero"}</span></h2>
            <p className="mt-1 text-[11px] text-[#aaa294] sm:text-xs">{game.result || "N/D"}<span className="mx-2 text-[#655a49]">·</span>Accuratezza: <span className="font-semibold text-[#e5d0a6]">{analysis.whiteAccuracy}% (B)</span> vs <span className="font-semibold text-[#b8c99a]">{analysis.blackAccuracy}% (N)</span></p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => { if (autoVoice) stop(); setAutoVoice(!autoVoice); }} className={`min-h-10 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${autoVoice ? "border-[#6e9467]/50 bg-[#46714e]/25 text-[#d0dfb7]" : "border-[#514432] bg-[#2c261d] text-[#a39a89]"}`} aria-pressed={autoVoice}>{autoVoice ? "♫ Voce attiva" : "♪ Voce spenta"}</button>
            <button onClick={onClose} className="min-h-10 rounded-xl border border-[#514432] bg-[#30271c] px-3 py-2 text-xs font-semibold text-[#e0d4c0] transition hover:border-[#a37a42] hover:bg-[#3c3021]">Chiudi <span aria-hidden="true">×</span></button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-3 sm:gap-6 sm:p-5 md:grid-cols-12 md:p-6">
          <section className="flex min-w-0 flex-col items-center justify-start gap-3 sm:gap-4 md:col-span-7 md:justify-center" aria-label="Scacchiera e controlli di riproduzione">
            <ChessBoardView fen={currentFen} lastMoveUci={currentMove?.uci}/>
            <nav className="flex w-full max-w-[440px] items-center justify-between gap-1 rounded-2xl border border-[#4b3c29] bg-[#171511]/75 p-1.5 sm:justify-center sm:gap-2 sm:p-2" aria-label="Navigazione mosse">
              <button onClick={() => setCurrentStep(0)} disabled={currentStep === 0} className="grid h-10 min-w-10 place-items-center rounded-xl bg-[#30271c] px-2 text-sm text-[#e4d4b7] transition hover:bg-[#493a27] disabled:opacity-30 sm:px-3" title="Inizio partita" aria-label="Inizio partita">«</button>
              <button onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))} disabled={currentStep === 0} className={moveButton}><span className="sm:hidden">‹</span><span className="hidden sm:inline">‹ Precedente</span></button>
              <span className="whitespace-nowrap px-1 text-[10px] font-mono text-[#b5a98f] sm:px-3 sm:text-xs">{currentStep} / {moves.length}</span>
              <button onClick={() => setCurrentStep((prev) => Math.min(moves.length, prev + 1))} disabled={currentStep === moves.length} className={moveButton}><span className="sm:hidden">›</span><span className="hidden sm:inline">Successiva ›</span></button>
              <button onClick={() => setCurrentStep(moves.length)} disabled={currentStep === moves.length} className="grid h-10 min-w-10 place-items-center rounded-xl bg-[#30271c] px-2 text-sm text-[#e4d4b7] transition hover:bg-[#493a27] disabled:opacity-30 sm:px-3" title="Fine partita" aria-label="Fine partita">»</button>
            </nav>
            <p className="text-center text-[10px] text-[#898171] sm:text-[11px]">Usa le frecce ← → della tastiera per scorrere le mosse.</p>
          </section>

          <section className="flex min-w-0 flex-col gap-3 sm:gap-4 md:col-span-5" aria-label="Commenti e lista mosse">
            <CoachAvatar mood={coachMood} isSpeaking={isSpeaking} name="Maestro Denis"/>
            {currentMove ? <div className="space-y-3 rounded-2xl border border-[#4b3c29] bg-[#171511]/75 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="text-xs font-bold text-[#e6d9c3] sm:text-sm">Mossa {currentMove.moveNumber} ({currentMove.color === "white" ? "Bianco" : "Nero"}):</span><span className="font-mono text-lg font-extrabold text-[#f4eee2]">{currentMove.san}</span></div>{moveConfig && <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${moveConfig.badgeColor}`}><span>{moveConfig.icon}</span><span>{moveConfig.label}</span></span>}</div>
              <div className="space-y-2 rounded-xl border border-[#453a2a] bg-[#252018] p-3 text-xs leading-relaxed text-[#c7beae] sm:p-3.5"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 font-semibold text-[#c8d9a9]"><span>♞</span> Coach:</span><button onClick={() => isSpeaking ? stop() : speak(coachComment)} disabled={loadingComment || !coachComment} className="flex min-h-8 items-center gap-1 rounded-lg border border-[#514432] bg-[#30271c] px-2 text-[10px] text-[#e0d4c0] transition hover:bg-[#493a27] disabled:opacity-50 sm:text-[11px]" title="Riascolta voce">{isSpeaking ? "♫ In ascolto" : "♪ Riascolta"}</button></div><p className={`${coachComment.startsWith("Coach AI non configurato") || coachComment.startsWith("DeepSeek") ? "not-italic text-[#e6c18d]" : "italic text-[#eee4d2]"}`}>{loadingComment ? "Il coach sta preparando un commento…" : coachComment}</p></div>
              {currentMove.classification !== "best" && currentMove.bestMove && <div className="flex items-center justify-between gap-3 rounded-xl border border-[#55704b]/50 bg-[#315640]/20 p-2.5 text-xs text-[#b8b09e]"><span>Mossa migliore consigliata:</span><span className="font-mono font-bold text-[#c6d9ad]">{currentMove.bestMove}</span></div>}
            </div> : <div className="rounded-2xl border border-[#4b3c29] bg-[#171511]/75 px-4 py-6 text-center text-xs text-[#aaa294]">Posizione iniziale. Premi <strong className="text-[#e6d4b5]">Successiva ›</strong> per vedere la prima mossa.</div>}

            <div className="max-h-52 flex-1 overflow-y-auto rounded-2xl border border-[#4b3c29] bg-[#171511]/75 p-3 sm:max-h-72">
              <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#ba965d] sm:text-xs">Sequenza delle mosse</h3>
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
