import type { analyses, games } from "@/db/schema";

/**
 * Dettaglio classificazione mossa scacchistica
 */
export type MoveClassification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "missed_win"
  | "book";

/**
 * Struttura per ogni singola mossa analizzata
 */
export type AnalyzedMove = {
  moveNumber: number;
  color: "white" | "black";
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  evaluation: {
    type: "cp" | "mate";
    value: number; // centipawns oppure mosse al matto
  };
  bestMove?: string;
  bestEvaluation?: {
    type: "cp" | "mate";
    value: number;
  };
  classification?: MoveClassification;
  comment?: string;
};

/**
 * Struttura di riepilogo dell'analisi (accuracy, conteggio errori/blunder)
 */
export type AnalysisSummary = {
  whiteAccuracy?: number;
  blackAccuracy?: number;
  whiteStats?: {
    brilliant?: number;
    great?: number;
    best?: number;
    excellent?: number;
    good?: number;
    inaccuracies?: number;
    mistakes?: number;
    blunders?: number;
  };
  blackStats?: {
    brilliant?: number;
    great?: number;
    best?: number;
    excellent?: number;
    good?: number;
    inaccuracies?: number;
    mistakes?: number;
    blunders?: number;
  };
  [key: string]: unknown;
};

/**
 * Entità Analysis di ritorno dal database (Select)
 */
export type Analysis = typeof analyses.$inferSelect;

/**
 * Payload per l'inserimento di una nuova Analysis (Insert)
 */
export type NewAnalysis = typeof analyses.$inferInsert;

/**
 * Analisi con riferimento alla partita associata
 */
export type AnalysisWithGame = Analysis & {
  game: typeof games.$inferSelect;
};

/**
 * DTO di ritorno tipizzato con JSON parsato in oggetti strutturati
 */
export type AnalysisResponse = {
  id: string;
  gameId: string;
  depth: number;
  whiteAccuracy: string | null;
  blackAccuracy: string | null;
  summary: AnalysisSummary;
  movesData: AnalyzedMove[] | Record<string, unknown>;
  createdAt: Date | null;
};


export interface GameAnalysisResult {
  depth: number;
  whiteAccuracy: number;
  blackAccuracy: number;
  summary: AnalysisSummary;
  movesData: AnalyzedMove[];
}