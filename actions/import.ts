"use server";

import { ChessComService } from "@/services/chess-com.service";
import { LichessService } from "@/services/lichess.service";
import { saveGameFromPgn } from "./games";
import type { Game } from "@/types";

export interface ImportGamesOptions {
  platform: "chesscom" | "lichess";
  platformUsername: string;
  userId?: string | null;
  limit?: number;
}

export interface ImportedGameResult {
  game: Game;
  isExisting: boolean;
}

/**
 * Server Action: Scarica le partite da Chess.com o Lichess e le salva nel database.
 * Estremamente veloce (nessuna analisi Stockfish bloccante).
 */
export async function importRecentGames(
  options: ImportGamesOptions
): Promise<ImportedGameResult[]> {
  const { platform, platformUsername, userId, limit = 10 } = options;

  // 1. Fetch istantaneo da API esterna
  const externalGames =
    platform === "chesscom"
      ? await ChessComService.getRecentGames(platformUsername, limit)
      : await LichessService.getRecentGames(platformUsername, limit);

  const results: ImportedGameResult[] = [];

  // 2. Salva ciascuna partita nel database
  for (const extGame of externalGames) {
    const saved = await saveGameFromPgn({
      userId,
      pgn: extGame.pgn,
      knownUsername: platformUsername,
    });

    results.push({
      game: saved.game,
      isExisting: saved.isExisting,
    });
  }

  return results;
}


