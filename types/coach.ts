import type { AnalyzedMove } from "./analysis";

/**
 * Payload per la generazione del commento da parte dell'Agente Coach
 */
export interface GenerateCoachCommentInput {
  move: AnalyzedMove;
  whitePlayer?: string | null;
  blackPlayer?: string | null;
}

/**
 * Stato e configurazione dell'Avatar Coach stile Chess.com Game Review
 */
export type CoachMood = "happy" | "neutral" | "shocked" | "thinking" | "proud";

export interface CoachPersonaState {
  name: string;
  title: string;
  mood: CoachMood;
  avatarUrl?: string;
}
