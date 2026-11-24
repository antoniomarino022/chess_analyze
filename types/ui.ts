import type { Analysis } from "./analysis";
import type { Game } from "./game";
import type { CoachMood } from "./coach";

export interface GameItem {
  game: Game;
  isExisting: boolean;
  analysis?: Analysis | null;
}

export interface GameReplayModalProps {
  game: Game;
  analysis: Analysis;
  onClose: () => void;
}

export interface ChessBoardViewProps {
  fen: string;
  lastMoveUci?: string;
  flipped?: boolean;
}

export interface CoachAvatarProps {
  mood: CoachMood;
  isSpeaking: boolean;
  name?: string;
}
