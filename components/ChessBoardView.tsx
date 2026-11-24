"use client";

import React, { useMemo } from "react";
import { Chess } from "chess.js";

interface ChessBoardViewProps {
  fen: string;
  lastMoveUci?: string;
  flipped?: boolean;
}

// Icone SVG vettoriali standard per ciascun pezzo degli scacchi
const PIECE_SVGS: Record<string, React.ReactNode> = {
  // Pezzi Bianchi
  P: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  R: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
        <path d="M34 14l-3 3H14l-3-3" />
        <path d="M31 17v12.5H14V17" />
        <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
        <path d="M11 14h23" />
      </g>
    </svg>
  ),
  N: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
        <circle cx="9.5" cy="25.5" r=".5" />
        <circle cx="15" cy="14.5" r=".7" />
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-11a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" />
      </g>
    </svg>
  ),
  B: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
        <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" />
      </g>
    </svg>
  ),
  Q: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" />
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="14" cy="9" r="2" />
        <circle cx="22.5" cy="8" r="2" />
        <circle cx="31" cy="9" r="2" />
        <circle cx="39" cy="12" r="2" />
      </g>
    </svg>
  ),
  K: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#ffffff"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22.5 11.63V6M20 8h5" />
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23v.5C19 16 9.5 13 5.5 19.5c-3 6 5 10.5 6 10.5v7z" />
        <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
      </g>
    </svg>
  ),

  // Pezzi Neri
  p: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#262421"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  r: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#262421"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
        <path d="M34 14l-3 3H14l-3-3" />
        <path d="M31 17v12.5H14V17" />
        <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
        <path d="M11 14h23" />
        <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 13.5h23" stroke="#fff" strokeWidth="1" />
      </g>
    </svg>
  ),
  n: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#262421"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
        <circle cx="9.5" cy="25.5" r=".5" fill="#fff" />
        <circle cx="15" cy="14.5" r=".7" fill="#fff" />
      </g>
    </svg>
  ),
  b: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#262421"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
        <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#fff" strokeWidth="1" />
      </g>
    </svg>
  ),
  q: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#262421"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" />
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="14" cy="9" r="2" />
        <circle cx="22.5" cy="8" r="2" />
        <circle cx="31" cy="9" r="2" />
        <circle cx="39" cy="12" r="2" />
        <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" stroke="#fff" strokeWidth="1" />
      </g>
    </svg>
  ),
  k: (
    <svg viewBox="0 0 45 45" className="w-4/5 h-4/5 drop-shadow-md">
      <g
        fill="#262421"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22.5 11.63V6M20 8h5" />
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23v.5C19 16 9.5 13 5.5 19.5c-3 6 5 10.5 6 10.5v7z" />
        <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#fff" strokeWidth="1" />
      </g>
    </svg>
  ),
};

export function ChessBoardView({ fen, lastMoveUci, flipped = false }: ChessBoardViewProps) {
  const board = useMemo(() => {
    try {
      const chess = new Chess(fen);
      return chess.board();
    } catch {
      return new Chess().board();
    }
  }, [fen]);

  const fromSquare = lastMoveUci ? lastMoveUci.slice(0, 2) : null;
  const toSquare = lastMoveUci ? lastMoveUci.slice(2, 4) : null;

  const files = flipped
    ? ["h", "g", "f", "e", "d", "c", "b", "a"]
    : ["a", "b", "c", "d", "e", "f", "g", "h"];

  const ranks = flipped
    ? [1, 2, 3, 4, 5, 6, 7, 8]
    : [8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="w-full max-w-[min(88vw,440px)] sm:max-w-[440px] aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_55px_rgba(0,0,0,.42)] border-[5px] border-[#a37a42] bg-[#315640] ring-1 ring-[#e6d4b5]/20 select-none transition-shadow duration-300">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank, rankIdx) =>
          files.map((file, fileIdx) => {
            const squareName = `${file}${rank}`;
            
            // Indici reali di chess.board(): riga 0 = rank 8, riga 7 = rank 1; col 0 = file 'a', col 7 = file 'h'
            const realRow = 8 - rank;
            const realCol = file.charCodeAt(0) - 97;
            const piece = board[realRow] ? board[realRow][realCol] : null;

            // Caselle in feltro verde e avorio, coordinate coordinate con il tema dell'app.
            const isDark = (realRow + realCol) % 2 === 1;
            const isHighlight =
              squareName === fromSquare || squareName === toSquare;

            let bgStyle = isDark ? "bg-[#477653]" : "bg-[#e6d4b5]";
            if (isHighlight) {
              bgStyle = isDark ? "bg-[#a9a64f]" : "bg-[#f0d88f]";
            }

            const pieceKey = piece
              ? piece.color === "w"
                ? piece.type.toUpperCase()
                : piece.type.toLowerCase()
              : null;

            return (
              <div
                key={squareName}
                className={`relative flex items-center justify-center ${bgStyle}`}
              >
                {/* Coordinata Numero (Rank) a sinistra */}
                {fileIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-bold leading-none pointer-events-none ${
                      isDark ? "text-[#e6d4b5]" : "text-[#315640]"
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* Coordinata Lettera (File) in basso */}
                {rankIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold leading-none pointer-events-none ${
                      isDark ? "text-[#e6d4b5]" : "text-[#315640]"
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Pezzo SVG Ufficiale ad alta risoluzione */}
                {pieceKey && PIECE_SVGS[pieceKey]}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
