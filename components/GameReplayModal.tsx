"use client";

import React, { useState, useEffect } from "react";
import { ChessBoardView } from "./ChessBoardView";
import type { Game, Analysis, AnalyzedMove, MoveClassification } from "@/types";

interface GameReplayModalProps {
  game: Game;
  analysis: Analysis;
  onClose: () => void;
}

// Mappatura colori, etichette e commenti del coach per ciascuna classificazione
const CLASSIFICATION_CONFIG: Record<
  MoveClassification,
  { label: string; badgeColor: string; icon: string; coachComment: string }
> = {
  brilliant: {
    label: "Brillante",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: "!!",
    coachComment: "Mossa geniale! Un sacrificio o una manovra tattica eccezionale.",
  },
  great: {
    label: "Ottima",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "!",
    coachComment: "Mossa fondamentale per mantenere il vantaggio nella posizione.",
  },
  best: {
    label: "Migliore",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: "★",
    coachComment: "Ottima mossa! È esattamente la mossa raccomandata da Stockfish.",
  },
  book: {
    label: "Libro",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "📖",
    coachComment: "Mossa standard di apertura (teoria di libro).",
  },
  excellent: {
    label: "Eccellente",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    icon: "✔",
    coachComment: "Mossa molto solida e precisa. Mantiene tutto il vantaggio.",
  },
  good: {
    label: "Buona",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "●",
    coachComment: "Una mossa naturale e giocabile, anche se c'era qualcosa di leggermente più incisivo.",
  },
  inaccuracy: {
    label: "Inesattezza",
    badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    icon: "▲",
    coachComment: "Non è un vero errore, ma cede una porzione di iniziativa all'avversario.",
  },
  mistake: {
    label: "Errore",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: "✖",
    coachComment: "Errore tattico o posizionale. L'avversario può approfittarne per ribaltare l'equilibrio.",
  },
  blunder: {
    label: "Grave Errore (Blunder)",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: "💀",
    coachComment: "Errore decisivo (svista grave). Perde materiale netto o compromette la partita.",
  },
  missed_win: {
    label: "Vittoria Mancata",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: "≠",
    coachComment: "C'era una combinazione vincente forzata che non è stata colta.",
  },
};

export function GameReplayModal({ game, analysis, onClose }: GameReplayModalProps) {
  const moves: AnalyzedMove[] = (analysis.movesData as any) || [];
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Navigazione da tastiera con le frecce direzionali
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentStep((prev) => Math.min(moves.length, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moves.length, onClose]);

  // Posizione corrente
  const currentMove: AnalyzedMove | null = currentStep > 0 ? moves[currentStep - 1] : null;
  const currentFen = currentMove
    ? currentMove.fenAfter
    : moves[0]?.fenBefore || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  const moveConfig =
    currentMove && currentMove.classification
      ? CLASSIFICATION_CONFIG[currentMove.classification]
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>♟</span> {game.whitePlayer || "Bianco"} vs {game.blackPlayer || "Nero"}
            </h3>
            <div className="text-xs text-zinc-400 mt-0.5">
              Risultato: {game.result || "N/D"} • Accuratezza:{" "}
              <span className="text-emerald-400 font-semibold">{analysis.whiteAccuracy}% (B)</span> vs{" "}
              <span className="text-sky-400 font-semibold">{analysis.blackAccuracy}% (N)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-3 py-1.5 rounded-xl text-sm transition"
          >
            Chiudi ✕
          </button>
        </div>

        {/* Corpo: Scacchiera a sinistra, Dettagli e Mosse a destra */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-y-auto">
          
          {/* Colonna Sinistra: Scacchiera */}
          <div className="md:col-span-7 flex flex-col items-center justify-center space-y-4">
            <ChessBoardView fen={currentFen} lastMoveUci={currentMove?.uci} />

            {/* Controlli Riproduzione */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(0)}
                disabled={currentStep === 0}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 px-3 py-1.5 rounded-lg text-sm text-zinc-200 transition"
                title="Inizio partita"
              >
                ⏮
              </button>
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 px-4 py-1.5 rounded-lg text-sm font-semibold text-zinc-200 transition"
              >
                ◀ Precedente
              </button>
              <span className="text-xs font-mono px-3 text-zinc-400">
                {currentStep} / {moves.length}
              </span>
              <button
                onClick={() => setCurrentStep((prev) => Math.min(moves.length, prev + 1))}
                disabled={currentStep === moves.length}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 px-4 py-1.5 rounded-lg text-sm font-semibold text-zinc-200 transition"
              >
                Successiva ▶
              </button>
              <button
                onClick={() => setCurrentStep(moves.length)}
                disabled={currentStep === moves.length}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 px-3 py-1.5 rounded-lg text-sm text-zinc-200 transition"
                title="Fine partita"
              >
                ⏭
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Usa i tasti freccia ◄ / ► della tastiera per scorrere rapidamente le mosse.
            </p>
          </div>

          {/* Colonna Destra: Feedback mossa e Lista mosse */}
          <div className="md:col-span-5 flex flex-col space-y-4">
            
            {/* Box Commento Coach Mossa Corrente */}
            {currentMove ? (
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-100">
                      Mossa {currentMove.moveNumber} ({currentMove.color === "white" ? "Bianco" : "Nero"}):
                    </span>
                    <span className="text-lg font-extrabold font-mono text-zinc-50">
                      {currentMove.san}
                    </span>
                  </div>
                  {moveConfig && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1 ${moveConfig.badgeColor}`}
                    >
                      <span>{moveConfig.icon}</span>
                      <span>{moveConfig.label}</span>
                    </span>
                  )}
                </div>

                {/* Commento esplicativo */}
                <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                  <span className="font-semibold text-zinc-400 block mb-1">Coach Note:</span>
                  {moveConfig?.coachComment}
                </div>

                {/* Suggerimento Stockfish se non è la migliore */}
                {currentMove.classification !== "best" && currentMove.bestMove && (
                  <div className="text-xs text-zinc-400 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl flex items-center justify-between">
                    <span>Mossa migliore consigliata:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {currentMove.bestMove}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-400 text-center py-6">
                Posizione iniziale di partenza. Clicca su <strong>Successiva ▶</strong> per vedere la prima mossa.
              </div>
            )}

            {/* Lista Mosse cliccabile */}
            <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 p-3 overflow-y-auto max-h-60 sm:max-h-72">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                Mosse Partita
              </h4>
              <div className="space-y-1 font-mono text-xs">
                {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => {
                  const whiteMove = moves[i * 2];
                  const blackMove = moves[i * 2 + 1];
                  const whiteIdx = i * 2 + 1;
                  const blackIdx = i * 2 + 2;

                  return (
                    <div
                      key={i}
                      className="grid grid-cols-12 py-1 px-2 rounded-lg hover:bg-zinc-900 text-zinc-300 items-center"
                    >
                      <span className="col-span-2 text-zinc-600 font-sans font-semibold">
                        {i + 1}.
                      </span>
                      {whiteMove && (
                        <button
                          onClick={() => setCurrentStep(whiteIdx)}
                          className={`col-span-5 text-left px-2 py-0.5 rounded transition ${
                            currentStep === whiteIdx
                              ? "bg-zinc-700 text-white font-bold"
                              : "hover:text-white"
                          }`}
                        >
                          {whiteMove.san}{" "}
                          <span className="text-[10px] opacity-75">
                            {whiteMove.classification
                              ? CLASSIFICATION_CONFIG[whiteMove.classification]?.icon
                              : ""}
                          </span>
                        </button>
                      )}
                      {blackMove && (
                        <button
                          onClick={() => setCurrentStep(blackIdx)}
                          className={`col-span-5 text-left px-2 py-0.5 rounded transition ${
                            currentStep === blackIdx
                              ? "bg-zinc-700 text-white font-bold"
                              : "hover:text-white"
                          }`}
                        >
                          {blackMove.san}{" "}
                          <span className="text-[10px] opacity-75">
                            {blackMove.classification
                              ? CLASSIFICATION_CONFIG[blackMove.classification]?.icon
                              : ""}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
