import { Chess } from "chess.js";
import type { GameAnalysisResult, AnalyzedMove, AnalysisSummary, MoveClassification } from "@/types";

export interface ClientAnalyzerProgress {
  current: number;
  total: number;
  percent: number;
}

function calculateMoveAccuracy(winPercentBefore: number, winPercentAfter: number): number {
  const winPercentDrop = Math.max(0, winPercentBefore - winPercentAfter);
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winPercentDrop) - 3.1669));
}

function scoreToWinProbability(type: "cp" | "mate", value: number): number {
  if (type === "mate") {
    return value > 0 ? 100 : 0;
  }
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * value)) - 1);
}

function classifyMove(
  isBestMove: boolean,
  winProbDrop: number,
  moveNumber: number
): MoveClassification {
  if (isBestMove) return "best";
  if (moveNumber <= 5 && winProbDrop < 2) return "book";
  if (winProbDrop <= 2) return "excellent";
  if (winProbDrop <= 5) return "good";
  if (winProbDrop <= 10) return "inaccuracy";
  if (winProbDrop <= 20) return "mistake";
  return "blunder";
}

export class ClientStockfishEngine {
  private worker: Worker | null = null;
  private isReady = false;

  public async init(): Promise<void> {
    if (this.isReady && this.worker) return;

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker("/stockfish.js");
        const timeout = setTimeout(() => {
          reject(new Error("Timeout inizializzazione Stockfish Worker"));
        }, 10000);

        this.worker.onmessage = (event: MessageEvent) => {
          const line = typeof event.data === "string" ? event.data : "";
          if (line.includes("readyok")) {
            clearTimeout(timeout);
            this.isReady = true;
            resolve();
          }
        };

        this.worker.onerror = (err) => {
          clearTimeout(timeout);
          reject(new Error(`Errore Web Worker Stockfish: ${err.message}`));
        };

        this.worker.postMessage("uci");
        this.worker.postMessage("isready");
      } catch (err) {
        reject(err);
      }
    });
  }

  public async evaluateFen(fen: string, depth = 8): Promise<{
    depth: number;
    score: { type: "cp" | "mate"; value: number };
    bestMove: string;
    pv: string[];
  }> {
    await this.init();

    return new Promise((resolve) => {
      let currentDepth = 0;
      let scoreType: "cp" | "mate" = "cp";
      let scoreValue = 0;
      let pvMoves: string[] = [];
      const isBlackToMove = fen.includes(" b ");

      const timeout = setTimeout(() => {
        if (this.worker) this.worker.postMessage("stop");
        resolve({
          depth: 1,
          score: { type: "cp", value: 0 },
          bestMove: "",
          pv: [],
        });
      }, 7000);

      const handler = (event: MessageEvent) => {
        const line = typeof event.data === "string" ? event.data : "";

        if (line.startsWith("info") && line.includes("score")) {
          const depthMatch = line.match(/depth\s+(\d+)/);
          if (depthMatch) {
            currentDepth = parseInt(depthMatch[1], 10);
          }

          const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
          const mateMatch = line.match(/score\s+mate\s+(-?\d+)/);

          if (cpMatch) {
            scoreType = "cp";
            const val = parseInt(cpMatch[1], 10);
            scoreValue = isBlackToMove ? -val : val;
          } else if (mateMatch) {
            scoreType = "mate";
            const val = parseInt(mateMatch[1], 10);
            scoreValue = isBlackToMove ? -val : val;
          }

          const pvMatch = line.match(/pv\s+(.+)$/);
          if (pvMatch) {
            pvMoves = pvMatch[1].trim().split(/\s+/);
          }
        }

        if (line.startsWith("bestmove")) {
          clearTimeout(timeout);
          if (this.worker) {
            this.worker.removeEventListener("message", handler);
          }
          const parts = line.split(/\s+/);
          const bestMove = parts[1] || "";

          resolve({
            depth: currentDepth || depth,
            score: {
              type: scoreType,
              value: scoreValue,
            },
            bestMove,
            pv: pvMoves,
          });
        }
      };

      if (this.worker) {
        this.worker.addEventListener("message", handler);
        this.worker.postMessage(`position fen ${fen}`);
        this.worker.postMessage(`go depth ${depth}`);
      } else {
        clearTimeout(timeout);
        resolve({ depth: 1, score: { type: "cp", value: 0 }, bestMove: "", pv: [] });
      }
    });
  }

  public terminate(): void {
    if (this.worker) {
      try {
        this.worker.postMessage("quit");
        this.worker.terminate();
      } catch {}
      this.worker = null;
      this.isReady = false;
    }
  }
}

/**
 * Esegue l'analisi completa di un PGN direttamente nel browser.
 * Supporta qualsiasi numero di mosse senza alcun limite di tempo server.
 */
export async function analyzePgnInBrowser(
  pgn: string,
  depth = 8,
  onProgress?: (progress: ClientAnalyzerProgress) => void
): Promise<GameAnalysisResult> {
  const chess = new Chess();
  chess.loadPgn(pgn.trim());

  const history = chess.history({ verbose: true });
  if (history.length === 0) {
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

  // Costruisce la timeline FEN
  const replayChess = new Chess();
  const moves: {
    moveNumber: number;
    color: "white" | "black";
    san: string;
    uci: string;
    fenBefore: string;
    fenAfter: string;
  }[] = [];

  for (let i = 0; i < history.length; i++) {
    const m = history[i];
    const fenBefore = replayChess.fen();
    replayChess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const fenAfter = replayChess.fen();
    moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      color: m.color === "w" ? "white" : "black",
      san: m.san,
      uci: `${m.from}${m.to}${m.promotion || ""}`,
      fenBefore,
      fenAfter,
    });
  }

  const engine = new ClientStockfishEngine();
  await engine.init();

  const movesData: AnalyzedMove[] = [];
  const whiteAccuracies: number[] = [];
  const blackAccuracies: number[] = [];

  const whiteStats: Record<string, number> = {
    best: 0, excellent: 0, good: 0, inaccuracies: 0, mistakes: 0, blunders: 0,
  };
  const blackStats: Record<string, number> = {
    best: 0, excellent: 0, good: 0, inaccuracies: 0, mistakes: 0, blunders: 0,
  };

  try {
    let lastEval: { fen: string; evaluation: any } | null = null;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: moves.length,
          percent: Math.round(((i + 1) / moves.length) * 100),
        });
      }

      let evalBefore: any;
      if (lastEval && lastEval.fen === move.fenBefore) {
        evalBefore = lastEval.evaluation;
      } else {
        evalBefore = await engine.evaluateFen(move.fenBefore, depth);
      }

      const evalAfter = await engine.evaluateFen(move.fenAfter, depth);
      lastEval = { fen: move.fenAfter, evaluation: evalAfter };

      const isWhite = move.color === "white";
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
    engine.terminate();
  }

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
    depth,
    whiteAccuracy: avgWhiteAccuracy,
    blackAccuracy: avgBlackAccuracy,
    summary,
    movesData,
  };
}
