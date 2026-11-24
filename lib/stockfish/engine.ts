import fs from "fs";
import path from "path";
import vm from "vm";

import { StockfishEvaluation } from "@/types";

/**
 * Wrapper asincrono per Stockfish WebAssembly/JS in ambiente Node.js.
 * Utilizza un contesto vm isolato che emula l'interfaccia message/postMessage dei Web Worker.
 */
export class StockfishEngine {
  private sandbox: any;
  private isReady = false;

  constructor() {
    this.initEngine();
  }

  private initEngine() {
    let scriptContent = "";
    try {
      const stockfishPath = path.resolve(process.cwd(), "node_modules/stockfish.js/stockfish.js");
      scriptContent = fs.readFileSync(stockfishPath, "utf8");
    } catch {
      // Fallback per bundler Webpack/Next.js e serverless
      try {
        const resolvedPath = require.resolve("stockfish.js/stockfish.js");
        scriptContent = fs.readFileSync(resolvedPath, "utf8");
      } catch (e: any) {
        throw new Error(`Impossibile caricare il file binario di Stockfish: ${e.message}`);
      }
    }

    this.sandbox = {
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Buffer,
      close: () => {},
      onmessage: null as ((event: { data: string }) => void) | null,
      postMessage: () => {},
    };

    const context = vm.createContext(this.sandbox);
    vm.runInContext(scriptContent, context);
  }

  /**
   * Invia un comando UCI e attende che Stockfish sia pronto ("readyok")
   */
  public async init(): Promise<void> {
    if (this.isReady) return;

    return new Promise((resolve) => {
      this.sandbox.postMessage = (line: string) => {
        if (typeof line === "string" && line.includes("readyok")) {
          this.isReady = true;
          resolve();
        }
      };

      this.sendCommand("uci");
      this.sendCommand("isready");
    });
  }

  /**
   * Invia un comando UCI grezzo a Stockfish
   */
  public sendCommand(cmd: string): void {
    if (this.sandbox.onmessage) {
      this.sandbox.onmessage({ data: cmd });
    }
  }

  /**
   * Valuta una posizione espressa in formato FEN ad una data profondità (depth)
   */
  public async evaluateFen(fen: string, depth = 6): Promise<StockfishEvaluation> {
    await this.init();

    return new Promise((resolve, reject) => {
      let currentDepth = 0;
      let scoreType: "cp" | "mate" = "cp";
      let scoreValue = 0;
      let pvMoves: string[] = [];
      const isBlackToMove = fen.includes(" b ");

      const timeout = setTimeout(() => {
        this.sendCommand("stop");
        // Invece di interrompere brutalmente con reject, risolve con una valutazione neutra
        // per evitare che l'intera partita fallisca se una singola mossa impiega troppo tempo.
        resolve({
          depth: 1,
          score: { type: "cp", value: 0 },
          bestMove: "",
          pv: [],
        });
      }, 4000);

      this.sandbox.postMessage = (line: string) => {
        if (typeof line !== "string") return;

        // Esempio: info depth 12 score cp 35 nodes 24151 nps 4830200 pv e2e4 e7e5 ...
        if (line.startsWith("info") && line.includes("score")) {
          const depthMatch = line.match(/depth\s+(\d+)/);
          if (depthMatch) {
            currentDepth = parseInt(depthMatch[1], 10);
          }

          const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
          const mateMatch = line.match(/score\s+mate\s+(-?\d+)/);

          if (cpMatch) {
            scoreType = "cp";
            let val = parseInt(cpMatch[1], 10);
            // Stockfish riporta il punteggio relativo al giocatore di turno.
            // Lo normalizziamo sempre dal punto di vista del Bianco (+ = Bianco in vantaggio, - = Nero in vantaggio)
            scoreValue = isBlackToMove ? -val : val;
          } else if (mateMatch) {
            scoreType = "mate";
            let val = parseInt(mateMatch[1], 10);
            scoreValue = isBlackToMove ? -val : val;
          }

          const pvMatch = line.match(/pv\s+(.+)$/);
          if (pvMatch) {
            pvMoves = pvMatch[1].trim().split(/\s+/);
          }
        }

        // Segnale di termine analisi
        if (line.startsWith("bestmove")) {
          clearTimeout(timeout);
          const parts = line.split(/\s+/);
          const bestMove = parts[1] || "";

          resolve({
            depth: currentDepth || depth,
            score: {
              type: scoreType,
              value: scoreValue,
            },
            bestMove,
            pv: pvMoves,
          });
        }
      };

      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }

  /**
   * Ferma e chiude il motore
   */
  public quit(): void {
    this.sendCommand("quit");
  }
}
