import { Chess } from "chess.js";
import type { AnalyzedMove } from "@/types";

export interface CoachFeedback {
  comment: string;
  bestMoveSan?: string;
  bestMoveUci?: string;
  playedMoveUci?: string;
  threatSquare?: string;
  mood: "proud" | "happy" | "neutral" | "thinking" | "shocked";
}

const PIECE_NAMES_IT: Record<string, string> = {
  p: "pedone",
  n: "cavallo",
  b: "alfiere",
  r: "torre",
  q: "donna",
  k: "re",
};

const PIECE_NAMES_EN: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

/**
 * Converte una mossa UCI (es. "e2e4") in notazione SAN leggibile usando la posizione FEN di partenza
 */
export function uciToSan(fen: string, uci: string): string {
  if (!uci || uci.length < 4) return uci;
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

/**
 * Genera un commento contestuale intelligente e le indicazioni visive (frecce) per il coach.
 */
export function generateCoachFeedback(
  currentMove: AnalyzedMove | null,
  userColor: "white" | "black" | null | undefined,
  language: "it" | "en" = "it"
): CoachFeedback {
  const isIt = language === "it";
  const pieceNames = isIt ? PIECE_NAMES_IT : PIECE_NAMES_EN;

  if (!currentMove) {
    return {
      comment: isIt
        ? "Posizione iniziale. Usa le frecce per analizzare ogni mossa insieme a me!"
        : "Starting position. Use the arrow keys to review each move with me!",
      mood: "neutral",
    };
  }

  const isUserMove = userColor ? currentMove.color === userColor : true;
  const classification = currentMove.classification || "good";
  const san = currentMove.san;
  const uci = currentMove.uci;
  const bestUci = currentMove.bestMove || "";
  const bestSan = bestUci ? uciToSan(currentMove.fenBefore, bestUci) : "";

  // Analisi scacchistica con chess.js della mossa giocata
  let pieceType = "p";
  let capturedPiece: string | null = null;
  let isCheck = false;
  let isCastling = san.includes("O-O");
  let fromSquare = uci.slice(0, 2);
  let toSquare = uci.slice(2, 4);

  try {
    const chessBefore = new Chess(currentMove.fenBefore);
    const pieceBefore = chessBefore.get(fromSquare as any);
    if (pieceBefore) pieceType = pieceBefore.type;

    const pieceTarget = chessBefore.get(toSquare as any);
    if (pieceTarget) capturedPiece = pieceTarget.type;

    const chessAfter = new Chess(currentMove.fenAfter);
    isCheck = chessAfter.inCheck();
  } catch {}

  const pieceName = pieceNames[pieceType] || (isIt ? "pezzo" : "piece");
  const capturedName = capturedPiece ? pieceNames[capturedPiece] : null;

  // 1. BRILLANTE / SACRIFICIO O COMBINAZIONE
  if (classification === "brilliant") {
    return {
      comment: isUserMove
        ? isIt
          ? `Mossa geniale con ${san}! Un sacrificio o manovra tattica straordinaria che ribalta la posizione!`
          : `Brilliant move with ${san}! An incredible tactical blow that tears the game wide open!`
        : isIt
          ? `L'avversario ha trovato una mossa brillante (${san}). Massima attenzione ai contrattacchi!`
          : `Opponent found a brilliant move (${san}). Watch out for their counterattack!`,
      playedMoveUci: uci,
      mood: "proud",
    };
  }

  // 2. MIGLIORE / BEST MOVE O LIBRO
  if (classification === "best" || classification === "book") {
    if (isCastling) {
      return {
        comment: isUserMove
          ? isIt
            ? `Ottimo arrocco (${san})! Metti al sicuro il Re e attivi la torre lungo la colonna.`
            : `Great castle (${san})! Tucks the King away safely and activates the rook.`
          : isIt
            ? `L'avversario mette al sicuro il proprio Re con l'arrocco.`
            : `Opponent puts their King to safety with castles.`,
        playedMoveUci: uci,
        mood: "happy",
      };
    }

    if (capturedName) {
      return {
        comment: isUserMove
          ? isIt
            ? `Cattura precisa (${san}): guadagni il ${capturedName} avversario con la scelta migliore del motore.`
            : `Precise capture (${san}): winning the opponent's ${capturedName} with the engine's top choice.`
          : isIt
            ? `L'avversario cattura il tuo ${capturedName} con precisione chirurgica.`
            : `Opponent captures your ${capturedName} with surgical precision.`,
        playedMoveUci: uci,
        mood: "happy",
      };
    }

    if (isCheck) {
      return {
        comment: isUserMove
          ? isIt
            ? `Scacco eccellente con ${san}! Mantieni l'iniziativa e metti pressione al Re avversario.`
            : `Excellent check with ${san}! Keeps the initiative and pressures the enemy King.`
          : isIt
            ? `L'avversario dà scacco con ${san}. Devi rispondere immediatamente.`
            : `Opponent gives check with ${san}. You must address it immediately.`,
        playedMoveUci: uci,
        mood: "happy",
      };
    }

    return {
      comment: isUserMove
        ? isIt
          ? `Mossa migliore! ${san} sviluppa il ${pieceName} sulla casella ottimale raccomandata da Stockfish.`
          : `Best move! ${san} develops the ${pieceName} onto the engine's ideal square.`
        : isIt
          ? `L'avversario trova la continuazione più solida (${san}).`
          : `Opponent plays the most accurate reply (${san}).`,
      playedMoveUci: uci,
      mood: "happy",
    };
  }

  // 3. OTTIMA O ECCELLENTE
  if (classification === "great" || classification === "excellent") {
    return {
      comment: isUserMove
        ? isIt
          ? `Ottima scelta con ${san}. Mantieni la posizione solida e tutto il vantaggio.`
          : `Strong move with ${san}. Keeps your position firm and preserves the advantage.`
        : isIt
          ? `L'avversario risponde con ${san}, una mossa solida e precisa.`
          : `Opponent replies with ${san}, a solid and resilient move.`,
      playedMoveUci: uci,
      mood: "happy",
    };
  }

  // 4. BUONA
  if (classification === "good") {
    return {
      comment: isUserMove
        ? isIt
          ? `${san} è una mossa naturale e giocabile, anche se c'era un'idea più incisiva come ${bestSan || "un'altra manovra"}.`
          : `${san} is completely playable, though an alternative like ${bestSan || "another idea"} was slightly sharper.`
        : isIt
          ? `L'avversario muove ${san}. La partita rimane equilibrata.`
          : `Opponent plays ${san}. The balance of the game is maintained.`,
      playedMoveUci: uci,
      bestMoveUci: bestUci !== uci ? bestUci : undefined,
      bestMoveSan: bestSan,
      mood: "neutral",
    };
  }

  // 5. INESATTEZZA (INACCURACY)
  if (classification === "inaccuracy") {
    return {
      comment: isUserMove
        ? isIt
          ? `Inesattezza con ${san}. Era preferibile giocare ${bestSan || bestUci}, che garantiva maggior controllo.`
          : `Inaccuracy with ${san}. Playing ${bestSan || bestUci} would have provided much better control.`
        : isIt
          ? `L'avversario è stato impreciso con ${san}. Poteva giocare ${bestSan || bestUci}.`
          : `Opponent was inaccurate with ${san}. They could have played ${bestSan || bestUci}.`,
      playedMoveUci: uci,
      bestMoveUci: bestUci,
      bestMoveSan: bestSan,
      mood: "thinking",
    };
  }

  // 6. ERRORE (MISTAKE)
  if (classification === "mistake") {
    return {
      comment: isUserMove
        ? isIt
          ? `Errore: muovendo ${san} cedi l'iniziativa. La mossa corretta raccomandata era ${bestSan || bestUci}!`
          : `Mistake: by playing ${san} you give up the initiative. The correct move was ${bestSan || bestUci}!`
        : isIt
          ? `Errore dell'avversario con ${san}! Avrebbe dovuto giocare ${bestSan || bestUci}. Approfittane!`
          : `Opponent made a mistake with ${san}! Best was ${bestSan || bestUci}. Punish it!`,
      playedMoveUci: uci,
      bestMoveUci: bestUci,
      bestMoveSan: bestSan,
      threatSquare: toSquare,
      mood: "shocked",
    };
  }

  // 7. GRAVE ERRORE (BLUNDER) O VITTORIA MANCATA (MISSED WIN)
  return {
    comment: isUserMove
      ? isIt
        ? `Grave svista (Blunder) con ${san}! Questa mossa perde materiale o rovina la posizione. La mossa salvavita era ${bestSan || bestUci} (indicata dalla freccia verde).`
        : `Major blunder with ${san}! This drops material or compromises your position. The key move was ${bestSan || bestUci} (green arrow).`
      : isIt
        ? `L'avversario ha commesso un grave errore con ${san}! Poteva difendersi solo con ${bestSan || bestUci}.`
        : `Opponent blundered with ${san}! Their only defense was ${bestSan || bestUci}.`,
    playedMoveUci: uci,
    bestMoveUci: bestUci,
    bestMoveSan: bestSan,
    threatSquare: toSquare,
    mood: "shocked",
  };
}
