import { Chess } from "chess.js";
import crypto from "crypto";


import { ParsedPgnMove,ParsedPgnResult } from "@/types/chess";
/**
 * Calcola l'hash SHA-256 (64 caratteri esadecimali) per un PGN normalizzato
 */
export function calculatePgnHash(normalizedPgn: string): string {
  return crypto.createHash("sha256").update(normalizedPgn.trim()).digest("hex");
}

/**
 * Parsing completo di una stringa PGN:
 * - Valida la sequenza di mosse tramite chess.js
 * - Estrae i metadati dagli header (White, Black, Date, Result)
 * - Calcola l'hash univoco SHA-256
 * - Restituisce la cronologia dettagliata FEN/mosse pronta per Stockfish
 */
export function parsePgn(pgnString: string, knownUsername?: string): ParsedPgnResult {
  const chess = new Chess();
  
  // Carica il PGN con chess.js
  try {
    chess.loadPgn(pgnString.trim());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`PGN non valido: ${message}`);
  }

  // Estrazione metadati dagli header PGN
  const headers = chess.getHeaders();
  const whitePlayer = headers["White"]?.trim() || null;
  const blackPlayer = headers["Black"]?.trim() || null;
  const result = headers["Result"]?.trim() || null;

  // Parsing data partita
  let playedAt: Date | null = null;
  const dateStr = headers["UTCDate"] || headers["Date"];
  const timeStr = headers["UTCTime"] || headers["Time"];
  if (dateStr && dateStr !== "????.??.??") {
    const formattedDate = dateStr.replace(/\./g, "-");
    const fullIsoString = timeStr ? `${formattedDate}T${timeStr}Z` : `${formattedDate}T00:00:00Z`;
    const parsed = new Date(fullIsoString);
    if (!isNaN(parsed.getTime())) {
      playedAt = parsed;
    }
  }

  // Determina il colore dell'utente se è stato passato un username (es. Chess.com o Lichess)
  let userColor: "white" | "black" | null = null;
  if (knownUsername) {
    const lowerUser = knownUsername.toLowerCase();
    if (whitePlayer && whitePlayer.toLowerCase() === lowerUser) {
      userColor = "white";
    } else if (blackPlayer && blackPlayer.toLowerCase() === lowerUser) {
      userColor = "black";
    }
  }

  // Ricostruisce la cronologia mossa per mossa con fenBefore e fenAfter
  const replayChess = new Chess();
  const history = chess.history({ verbose: true });
  const moves: ParsedPgnMove[] = [];

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const fenBefore = replayChess.fen();
    
    // Esegue la mossa nella scacchiera di replay
    const executed = replayChess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    const fenAfter = replayChess.fen();
    const uci = `${move.from}${move.to}${move.promotion || ""}`;

    moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      color: move.color === "w" ? "white" : "black",
      san: move.san,
      from: move.from,
      to: move.to,
      uci,
      fenBefore,
      fenAfter,
    });
  }

  const normalizedPgn = chess.pgn();
  const pgnHash = calculatePgnHash(normalizedPgn);

  return {
    pgnHash,
    normalizedPgn,
    whitePlayer,
    blackPlayer,
    userColor,
    result,
    playedAt,
    moves,
  };
}
