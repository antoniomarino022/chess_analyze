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
  depth = 6
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

  let analysisResult: GameAnalysisResult;
  try {
    analysisResult = await analyzeGamePgn(game.pgn, depth);
  } catch (error: any) {
    console.error(`[Stockfish Error] Impossibile analizzare partita ${gameId}:`, error);
    throw new Error(`Errore durante l'analisi Stockfish: ${error?.message || error}`);
  }

  // Verifica che whiteAccuracy e blackAccuracy siano numeri validi (non NaN)
  const whiteAcc = Number.isFinite(analysisResult.whiteAccuracy)
    ? analysisResult.whiteAccuracy.toFixed(2)
    : "100.00";
  const blackAcc = Number.isFinite(analysisResult.blackAccuracy)
    ? analysisResult.blackAccuracy.toFixed(2)
    : "100.00";

  // Salva a DB con gestione conflitti (onConflictDoUpdate o controllo)
  const newAnalysis: NewAnalysis = {
    gameId,
    depth: analysisResult.depth,
    whiteAccuracy: whiteAcc,
    blackAccuracy: blackAcc,
    summary: analysisResult.summary || {},
    movesData: analysisResult.movesData || [],
  };

  try {
    const [saved] = await db
      .insert(analyses)
      .values(newAnalysis)
      .onConflictDoUpdate({
        target: analyses.gameId,
        set: {
          depth: newAnalysis.depth,
          whiteAccuracy: newAnalysis.whiteAccuracy,
          blackAccuracy: newAnalysis.blackAccuracy,
          summary: newAnalysis.summary,
          movesData: newAnalysis.movesData,
        },
      })
      .returning();

    return { analysis: saved, isExisting: false };
  } catch (dbError: any) {
    console.error(`[DB Error] Errore inserimento analisi per partita ${gameId}:`, dbError);
    throw new Error(`Errore salvataggio analisi nel database: ${dbError?.message || dbError}`);
  }
}
