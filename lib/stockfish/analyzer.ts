import { StockfishEngine } from "./engine";
import { parsePgn } from "@/lib/chess/pgn";
import type { ParsedPgnResult } from "@/types/chess";
import type { AnalyzedMove, AnalysisSummary, MoveClassification } from "@/types";

import { GameAnalysisResult } from "@/types";
/**
 * Calcola l'accuracy percentage (stile Chess.com) a partire dalla perdita di centipawns
 */
function calculateMoveAccuracy(winPercentBefore: number, winPercentAfter: number): number {
  const winPercentDrop = Math.max(0, winPercentBefore - winPercentAfter);
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winPercentDrop) - 3.1669));
}

/**
 * Converte il punteggio Stockfish (centipawns o mate) in Win Percentage stimata [0 - 100]
 */
function scoreToWinProbability(type: "cp" | "mate", value: number): number {
  if (type === "mate") {
    return value > 0 ? 100 : 0;
  }
  // Formula sigmoidale standard usata da Lichess / Chess.com
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * value)) - 1);
}

/**
 * Classifica la mossa in base alla perdita di probabilità di vittoria e differenza di score
 */
function classifyMove(
  isBestMove: boolean,
  winProbDrop: number,
  moveNumber: number
): MoveClassification {
  if (isBestMove) {
    return "best";
  }
  if (moveNumber <= 5 && winProbDrop < 2) {
    return "book";
  }
  if (winProbDrop <= 2) return "excellent";
  if (winProbDrop <= 5) return "good";
  if (winProbDrop <= 10) return "inaccuracy";
  if (winProbDrop <= 20) return "mistake";
  return "blunder";
}



/**
 * Esegue l'analisi completa di una partita posizione per posizione.
 * Calcola una profondità dinamica per garantire che l'esecuzione rientri nei limiti di tempo di Vercel.
 */
export async function analyzeGamePgn(
  pgn: string,
  depth = 6,
  onProgress?: (current: number, total: number) => void
): Promise<GameAnalysisResult> {
  const parsed: ParsedPgnResult = parsePgn(pgn);

  if (!parsed.moves || parsed.moves.length === 0) {
    const emptySummary: AnalysisSummary = {
      whiteAccuracy: 100,
      blackAccuracy: 100,
      whiteStats: { best: 0, excellent: 0, good: 0, inaccuracies: 0, mistakes: 0, blunders: 0 },
      blackStats: { best: 0, excellent: 0, good: 0, inaccuracies: 0, mistakes: 0, blunders: 0 },
    };
    return {
      depth,
      whiteAccuracy: 100,
      blackAccuracy: 100,
      summary: emptySummary,
      movesData: [],
    };
  }

  // Se la partita ha molte semimosse, adattiamo la profondità per evitare timeout serverless
  // Esempio: > 60 semimosse (30 mosse intere) depth 4, altrimenti depth 5-6
  let effectiveDepth = depth;
  if (parsed.moves.length > 70) {
    effectiveDepth = Math.min(depth, 4);
  } else if (parsed.moves.length > 40) {
    effectiveDepth = Math.min(depth, 5);
  }

  const engine = new StockfishEngine();
  await engine.init();

  const movesData: AnalyzedMove[] = [];
  const whiteAccuracies: number[] = [];
  const blackAccuracies: number[] = [];

  const whiteStats: Record<string, number> = {
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracies: 0,
    mistakes: 0,
    blunders: 0,
  };
  const blackStats: Record<string, number> = {
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracies: 0,
    mistakes: 0,
    blunders: 0,
  };

  try {
    // Cache per evitare di ricalcolare due volte la stessa identica posizione FEN
    let lastEval: { fen: string; evaluation: any } | null = null;

    for (let i = 0; i < parsed.moves.length; i++) {
      const move = parsed.moves[i];
      if (onProgress) {
        onProgress(i + 1, parsed.moves.length);
      }

      // Valutazione posizione PRIMA della mossa: se calcolata nel turno precedente, riusala!
      let evalBefore: any;
      if (lastEval && lastEval.fen === move.fenBefore) {
        evalBefore = lastEval.evaluation;
      } else {
        evalBefore = await engine.evaluateFen(move.fenBefore, effectiveDepth);
      }

      // Valutazione posizione DOPO la mossa giocata
      const evalAfter = await engine.evaluateFen(move.fenAfter, effectiveDepth);
      lastEval = { fen: move.fenAfter, evaluation: evalAfter };

      const isWhite = move.color === "white";

      // Calcolo probabilità di vittoria dal punto di vista di chi muove
      const winProbBefore = isWhite
        ? scoreToWinProbability(evalBefore.score.type, evalBefore.score.value)
        : 100 - scoreToWinProbability(evalBefore.score.type, evalBefore.score.value);

      const winProbAfter = isWhite
        ? scoreToWinProbability(evalAfter.score.type, evalAfter.score.value)
        : 100 - scoreToWinProbability(evalAfter.score.type, evalAfter.score.value);

      const winProbDrop = Math.max(0, winProbBefore - winProbAfter);
      const moveAccuracy = calculateMoveAccuracy(winProbBefore, winProbAfter);

      if (isWhite) {
        whiteAccuracies.push(moveAccuracy);
      } else {
        blackAccuracies.push(moveAccuracy);
      }

      const isBest = move.uci === evalBefore.bestMove;
      const classification = classifyMove(isBest, winProbDrop, move.moveNumber);

      // Aggiorna statistiche
      const statsObj = isWhite ? whiteStats : blackStats;
      if (classification === "best") statsObj.best++;
      else if (classification === "excellent") statsObj.excellent++;
      else if (classification === "good") statsObj.good++;
      else if (classification === "inaccuracy") statsObj.inaccuracies++;
      else if (classification === "mistake") statsObj.mistakes++;
      else if (classification === "blunder") statsObj.blunders++;

      movesData.push({
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        uci: move.uci,
        fenBefore: move.fenBefore,
        fenAfter: move.fenAfter,
        evaluation: {
          type: evalAfter.score.type,
          value: evalAfter.score.value,
        },
        bestMove: evalBefore.bestMove,
        bestEvaluation: {
          type: evalBefore.score.type,
          value: evalBefore.score.value,
        },
        classification,
      });
    }
  } finally {
    engine.quit();
  }

  // Media accuratezze
  const avgWhiteAccuracy = whiteAccuracies.length
    ? Number((whiteAccuracies.reduce((a, b) => a + b, 0) / whiteAccuracies.length).toFixed(2))
    : 100;

  const avgBlackAccuracy = blackAccuracies.length
    ? Number((blackAccuracies.reduce((a, b) => a + b, 0) / blackAccuracies.length).toFixed(2))
    : 100;

  const summary: AnalysisSummary = {
    whiteAccuracy: avgWhiteAccuracy,
    blackAccuracy: avgBlackAccuracy,
    whiteStats,
    blackStats,
  };

  return {
    depth: effectiveDepth,
    whiteAccuracy: avgWhiteAccuracy,
    blackAccuracy: avgBlackAccuracy,
    summary,
    movesData,
  };
}
