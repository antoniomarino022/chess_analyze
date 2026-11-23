
export interface ParsedPgnMove {
  moveNumber: number;
  color: "white" | "black";
  san: string;       // es. "e4", "Nf3", "O-O"
  from: string;      // es. "e2"
  to: string;        // es. "e4"
  uci: string;       // es. "e2e4"
  fenBefore: string; // FEN prima della mossa
  fenAfter: string;  // FEN dopo la mossa
}

export interface ParsedPgnResult {
  pgnHash: string;
  normalizedPgn: string;
  whitePlayer: string | null;
  blackPlayer: string | null;
  userColor?: "white" | "black" | null;
  result: string | null;
  playedAt: Date | null;
  moves: ParsedPgnMove[];
}