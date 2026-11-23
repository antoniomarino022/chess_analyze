import type { games, users, analyses } from "@/db/schema";

/**
 * Entità Game di ritorno dal database (Select)
 */
export type Game = typeof games.$inferSelect;

/**
 * Payload per l'inserimento di una nuova Game nel database (Insert)
 */
export type NewGame = typeof games.$inferInsert;

/**
 * Partita con utente proprietario correlato
 */
export type GameWithUser = Game & {
  user: typeof users.$inferSelect;
};

/**
 * Partita con la relativa analisi Stockfish
 */
export type GameWithAnalysis = Game & {
  analysis: typeof analyses.$inferSelect | null;
};

/**
 * Partita completa con sia utente che analisi Stockfish
 */
export type GameWithDetails = Game & {
  user: typeof users.$inferSelect;
  analysis: typeof analyses.$inferSelect | null;
};

/**
 * Formato DTO di ritorno per le API di gioco
 */
export type GameResponse = {
  id: string;
  userId: string;
  pgnHash: string;
  pgn: string;
  whitePlayer: string | null;
  blackPlayer: string | null;
  userColor: "white" | "black" | null;
  result: string | null;
  playedAt: Date | null;
  createdAt: Date | null;
};


/**
 * Dati necessari per salvare una partita a partire dalla notazione PGN
 */
export interface SaveGameFromPgnInput {
  userId: string;
  pgn: string;
  knownUsername?: string;
  userColor?: "white" | "black";
}

/**
 * Valutazione StockFish
 */

export interface StockfishEvaluation {
  depth: number;
  score: {
    type: "cp" | "mate";
    value: number; // centipawns o mosse al matto (positivo = vantaggio bianco, negativo = vantaggio nero)
  };
  bestMove: string; // mossa UCI (es. "e2e4")
  pv?: string[];    // linea principale delle mosse
}

/**
 * Informazioni sintetiche su una partita scaricata da piattaforme esterne (Chess.com o Lichess)
 */
export interface ExternalGame {
  platform: "chesscom" | "lichess";
  id: string;
  url: string;
  pgn: string;
  white: {
    username: string;
    rating?: number;
  };
  black: {
    username: string;
    rating?: number;
  };
  timeClass?: string;
  playedAt: Date;
}



