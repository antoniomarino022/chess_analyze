"use server";

import { db } from "@/db";
import { games } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { parsePgn } from "@/lib/chess/pgn";
import type { Game, NewGame, GameWithAnalysis, SaveGameFromPgnInput } from "@/types";
import type { ParsedPgnResult } from "@/types/chess";

/**
 * Cerca una partita esistente per hash PGN (e opzionalmente userId)
 */
export async function findGameByUserAndHash(
  userId: string | null | undefined,
  pgnHash: string
): Promise<Game | null> {
  const whereClause = userId
    ? and(eq(games.userId, userId), eq(games.pgnHash, pgnHash))
    : eq(games.pgnHash, pgnHash);

  const result = await db
    .select()
    .from(games)
    .where(whereClause)
    .limit(1);

  return result[0] || null;
}

/**
 * Ottiene una partita tramite ID con l'eventuale analisi Stockfish
 */
export async function getGameByIdWithAnalysis(
  gameId: string
): Promise<GameWithAnalysis | null> {
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      analysis: true,
    },
  });

  return (game as GameWithAnalysis) || null;
}

/**
 * Effettua il parsing del PGN e salva la partita a database.
 * Se la partita esiste già, restituisce quella esistente.
 */
export async function saveGameFromPgn(input: SaveGameFromPgnInput): Promise<{
  game: Game;
  parsed: ParsedPgnResult;
  isExisting: boolean;
}> {
  const parsed = parsePgn(input.pgn, input.knownUsername);
  const resolvedColor = input.userColor || parsed.userColor || null;

  // Controllo unicità
  const existing = await findGameByUserAndHash(input.userId, parsed.pgnHash);
  if (existing) {
    return { game: existing, parsed, isExisting: true };
  }

  const newGame: NewGame = {
    userId: input.userId || null,
    pgnHash: parsed.pgnHash,
    pgn: parsed.normalizedPgn,
    whitePlayer: parsed.whitePlayer,
    blackPlayer: parsed.blackPlayer,
    userColor: resolvedColor,
    result: parsed.result,
    playedAt: parsed.playedAt,
  };

  const [saved] = await db.insert(games).values(newGame).returning();

  return { game: saved, parsed, isExisting: false };
}

/**
 * Elenco partite di un utente
 */
export async function listGamesByUserId(
  userId: string,
  limit = 20
): Promise<Game[]> {
  return db
    .select()
    .from(games)
    .where(eq(games.userId, userId))
    .orderBy(games.createdAt)
    .limit(limit);
}

