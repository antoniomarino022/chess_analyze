"use server";

import { db } from "@/db";
import { analyses, games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { analyzeGamePgn } from "@/lib/stockfish/analyzer";
import type { Analysis, NewAnalysis, GameAnalysisResult } from "@/types";

/**
 * Cerca l'analisi associata a una partita tramite gameId
 */
export async function getAnalysisByGameId(
  gameId: string
): Promise<Analysis | null> {
  const result = await db
    .select()
    .from(analyses)
    .where(eq(analyses.gameId, gameId))
    .limit(1);

  return result[0] || null;
}

/**
 * Esegue l'analisi Stockfish e la persiste nella tabella `analyses`.
 * Se l'analisi per questa partita esiste già, la restituisce senza ricalcolarla.
 */
export async function analyzeAndSaveGame(
  gameId: string,
  depth = 8
): Promise<{ analysis: Analysis; isExisting: boolean }> {
  // Controllo se già analizzata
  const existing = await getAnalysisByGameId(gameId);
  if (existing) {
    return { analysis: existing, isExisting: true };
  }

  // Recupera il PGN della partita
  const [game] = await db
    .select({ pgn: games.pgn })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1);

  if (!game) {
    throw new Error(`Partita non trovata con ID: ${gameId}`);
  }

  // Esegue Stockfish
  const analysisResult: GameAnalysisResult = await analyzeGamePgn(
    game.pgn,
    depth
  );

  // Salva a DB
  const newAnalysis: NewAnalysis = {
    gameId,
    depth: analysisResult.depth,
    whiteAccuracy: analysisResult.whiteAccuracy.toString(),
    blackAccuracy: analysisResult.blackAccuracy.toString(),
    summary: analysisResult.summary,
    movesData: analysisResult.movesData,
  };

  const [saved] = await db.insert(analyses).values(newAnalysis).returning();

  return { analysis: saved, isExisting: false };
}
