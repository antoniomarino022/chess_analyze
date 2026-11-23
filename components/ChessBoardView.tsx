"use client";

import React, { useMemo } from "react";
import { Chess } from "chess.js";

interface ChessBoardViewProps {
  fen: string;
  lastMoveUci?: string;
}

// Mappatura pezzi Unicode
const PIECE_SYMBOLS: Record<string, string> = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  P: "♙",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
};

export function ChessBoardView({ fen, lastMoveUci }: ChessBoardViewProps) {
  const board = useMemo(() => {
    try {
      const chess = new Chess(fen);
      return chess.board();
    } catch {
      return new Chess().board();
    }
  }, [fen]);

  // Evidenzia le caselle di partenza e arrivo dell'ultima mossa
  const fromSquare = lastMoveUci ? lastMoveUci.slice(0, 2) : null;
  const toSquare = lastMoveUci ? lastMoveUci.slice(2, 4) : null;

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="inline-block border-2 border-zinc-700 rounded-xl overflow-hidden shadow-2xl bg-zinc-900 select-none">
      <div className="grid grid-cols-8 w-72 h-72 sm:w-96 sm:h-96">
        {ranks.map((rank, rankIdx) =>
          files.map((file, fileIdx) => {
            const squareName = `${file}${rank}`;
            const piece = board[rankIdx][fileIdx];
            const isDark = (rankIdx + fileIdx) % 2 === 1;
            const isHighlight =
              squareName === fromSquare || squareName === toSquare;

            let bgColor = isDark ? "bg-[#779952]" : "bg-[#edeed1]";
            if (isHighlight) {
              bgColor = isDark ? "bg-[#baca44]" : "bg-[#f5f682]";
            }

            const isWhitePiece = piece && piece.color === "w";
            const symbol = piece
              ? PIECE_SYMBOLS[isWhitePiece ? piece.type.toUpperCase() : piece.type]
              : null;

            return (
              <div
                key={squareName}
                className={`relative flex items-center justify-center font-bold text-3xl sm:text-4xl ${bgColor}`}
              >
                {/* Notazione coordinate angolari */}
                {fileIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[9px] font-sans font-semibold ${
                      isDark ? "text-[#edeed1]" : "text-[#779952]"
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rankIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[9px] font-sans font-semibold ${
                      isDark ? "text-[#edeed1]" : "text-[#779952]"
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Pezzo scacchi */}
                {symbol && (
                  <span
                    className={`leading-none drop-shadow-sm ${
                      isWhitePiece
                        ? "text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_60%)]"
                        : "text-zinc-900"
                    }`}
                  >
                    {symbol}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
