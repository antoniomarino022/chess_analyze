"use client";

import { useState } from "react";
import { importRecentGames } from "@/actions/import";
import { saveGameFromPgn } from "@/actions/games";
import { analyzeAndSaveGame } from "@/actions/analysis";
import type { Game, Analysis } from "@/types";

interface GameItem {
  game: Game;
  isExisting: boolean;
  analysis?: Analysis | null;
}

export default function Home() {
  const [platform, setPlatform] = useState<"chesscom" | "lichess">("chesscom");
  const [username, setUsername] = useState("");
  const [pgnText, setPgnText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingGameId, setAnalyzingGameId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [gamesList, setGamesList] = useState<GameItem[]>([]);

  // 1. Scarica le partite (rapido: 1-2 secondi)
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setStatusMessage(`Download delle partite in corso per "${username}" da ${platform}...`);

    try {
      const data = await importRecentGames({
        platform,
        platformUsername: username.trim(),
        limit: 10,
      });

      setGamesList(data);
      setStatusMessage(`Scaricamento completato! Trovate ${data.length} partite. Scegli quale analizzare.`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Errore: ${err.message || "Errore durante l'importazione"}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Analizza una singola partita on-demand
  const handleAnalyzeGame = async (gameId: string) => {
    setAnalyzingGameId(gameId);
    setStatusMessage("Analisi con Stockfish in corso...");

    try {
      const res = await analyzeAndSaveGame(gameId, 10);
      setGamesList((prev) =>
        prev.map((item) =>
          item.game.id === gameId ? { ...item, analysis: res.analysis } : item
        )
      );
      setStatusMessage("Analisi partita completata con successo!");
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Errore analisi: ${err.message || "Errore sconosciuto"}`);
    } finally {
      setAnalyzingGameId(null);
    }
  };

  // 3. Salva e analizza PGN incollato manualmente
  const handleAnalyzePgn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgnText.trim()) return;

    setLoading(true);
    setStatusMessage("Salvataggio PGN...");

    try {
      const saved = await saveGameFromPgn({
        pgn: pgnText.trim(),
      });

      setGamesList((prev) => [{ game: saved.game, isExisting: saved.isExisting }, ...prev]);
      setStatusMessage("Partita salvata. Avvio analisi...");
      await handleAnalyzeGame(saved.game.id);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Errore: ${err.message || "Errore salvataggio PGN"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <span>♞</span> Chess Analyze
          </h1>
          <p className="text-zinc-400 mt-2 text-sm md:text-base">
            Scarica le tue partite da Chess.com / Lichess e scegli quale analizzare con Stockfish.
          </p>
        </header>

        {/* Form Sezioni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sezione A: Import da piattaforma */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-emerald-400 flex items-center gap-2">
                <span>🌐</span> Scarica da Piattaforma
              </h2>
              <form onSubmit={handleImport} className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      value="chesscom"
                      checked={platform === "chesscom"}
                      onChange={() => setPlatform("chesscom")}
                      className="accent-emerald-500"
                    />
                    Chess.com
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      value="lichess"
                      checked={platform === "lichess"}
                      onChange={() => setPlatform("lichess")}
                      className="accent-emerald-500"
                    />
                    Lichess.org
                  </label>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Es. antonio, hikaru"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-all shadow-md"
                >
                  {loading ? "Scaricamento in corso..." : "Scarica Partite"}
                </button>
              </form>
            </div>
          </div>

          {/* Sezione B: Incolla PGN */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-sky-400 flex items-center gap-2">
                <span>📋</span> Incolla Notazione PGN
              </h2>
              <form onSubmit={handleAnalyzePgn} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                    PGN Partita
                  </label>
                  <textarea
                    rows={4}
                    value={pgnText}
                    onChange={(e) => setPgnText(e.target.value)}
                    placeholder='1. e4 e5 2. Nf3 Nc6 3. Bb5...'
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !pgnText.trim()}
                  className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-all shadow-md"
                >
                  {loading ? "Elaborazione..." : "Importa e Analizza"}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Feedback / Stato */}
        {statusMessage && (
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-300">
            {statusMessage}
          </div>
        )}

        {/* Lista Partite Scaricate */}
        {gamesList.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Partite Disponibili ({gamesList.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {gamesList.map((item) => {
                const game = item.game;
                const analysis = item.analysis;
                const isAnalyzing = analyzingGameId === game.id;

                return (
                  <div
                    key={game.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 transition-all hover:border-zinc-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-zinc-100">
                          {game.whitePlayer || "Bianco"} vs {game.blackPlayer || "Nero"}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          Risultato: <span className="font-mono text-zinc-200">{game.result || "N/D"}</span> • Data:{" "}
                          {game.playedAt ? new Date(game.playedAt).toLocaleDateString() : "N/D"}
                        </div>
                      </div>

                      {/* Azione Analizza o Risultato Accuratezza */}
                      <div>
                        {analysis ? (
                          <div className="flex items-center gap-4 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
                            <div className="text-right">
                              <span className="text-[10px] text-zinc-500 uppercase block">Bianco</span>
                              <span className="text-sm font-bold text-emerald-400">
                                {analysis.whiteAccuracy}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-zinc-500 uppercase block">Nero</span>
                              <span className="text-sm font-bold text-sky-400">
                                {analysis.blackAccuracy}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAnalyzeGame(game.id)}
                            disabled={isAnalyzing || Boolean(analyzingGameId)}
                            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 text-xs font-semibold px-4 py-2 rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
                          >
                            {isAnalyzing ? "Analisi in corso..." : "⚡ Analizza Partita"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dettaglio Errori / Blunder se analizzata */}
                    {Boolean(analysis?.summary) && (
                      <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                        <div>
                          <div className="font-semibold text-zinc-300 mb-1">Mosse Bianco:</div>
                          <div className="text-zinc-400 space-y-0.5">
                            <div>★ Migliori: {String((analysis?.summary as any)?.whiteStats?.best ?? 0)}</div>
                            <div>▲ Inesattezze: {String((analysis?.summary as any)?.whiteStats?.inaccuracies ?? 0)}</div>
                            <div>✖ Errori: {String((analysis?.summary as any)?.whiteStats?.mistakes ?? 0)}</div>
                            <div>💀 Blunder: {String((analysis?.summary as any)?.whiteStats?.blunders ?? 0)}</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-300 mb-1">Mosse Nero:</div>
                          <div className="text-zinc-400 space-y-0.5">
                            <div>★ Migliori: {String((analysis?.summary as any)?.blackStats?.best ?? 0)}</div>
                            <div>▲ Inesattezze: {String((analysis?.summary as any)?.blackStats?.inaccuracies ?? 0)}</div>
                            <div>✖ Errori: {String((analysis?.summary as any)?.blackStats?.mistakes ?? 0)}</div>
                            <div>💀 Blunder: {String((analysis?.summary as any)?.blackStats?.blunders ?? 0)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
