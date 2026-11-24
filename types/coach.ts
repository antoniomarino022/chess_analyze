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
