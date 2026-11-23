"use server";

import { ChessComService } from "@/services/chess-com.service";
import { LichessService } from "@/services/lichess.service";
import { saveGameFromPgn } from "./games";
import { analyzeAndSaveGame } from "./analysis";

export interface ImportAndAnalyzeOptions {
  platform: "chesscom" | "lichess";
  platformUsername: string;
  userId?: string | null;
  limit?: number;
  depth?: number;
}

/**
 * Server Action: Scarica le partite recenti da Chess.com o Lichess,
 * le salva a database e avvia l'analisi Stockfish.
 */
export async function importAndAnalyzeRecentGames(options: ImportAndAnalyzeOptions) {
  const { platform, platformUsername, userId, limit = 5, depth = 12 } = options;

  // 1. Fetch da API esterna
  const externalGames =
    platform === "chesscom"
      ? await ChessComService.getRecentGames(platformUsername, limit)
      : await LichessService.getRecentGames(platformUsername, limit);

  const results = [];

  // 2. Salva e analizza ciascuna partita
  for (const extGame of externalGames) {
    // Salva nel database
    const saved = await saveGameFromPgn({
      userId,
      pgn: extGame.pgn,
      knownUsername: platformUsername,
    });

    // Avvia Stockfish e salva l'analisi nel database
    const analysisResult = await analyzeAndSaveGame(saved.game.id, depth);

    results.push({
      game: saved.game,
      isExisting: saved.isExisting,
      analysis: analysisResult.analysis,
    });
  }

  return results;
}

