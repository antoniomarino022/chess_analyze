import type { Game } from "./game";

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
