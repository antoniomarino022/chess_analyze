"use client";

import { useState } from "react";
import { importAndAnalyzeRecentGames } from "@/actions/import";
import { saveGameFromPgn } from "@/actions/games";
import { analyzeAndSaveGame } from "@/actions/analysis";

export default function Home() {
  const [platform, setPlatform] = useState<"chesscom" | "lichess">("chesscom");
  const [username, setUsername] = useState("");
  const [pgnText, setPgnText] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [results, setResults] = useState<any[]>([]);

  // 1. Import da Chess.com o Lichess
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setStatusMessage(`Download partite in corso per "${username}" da ${platform}...`);
    setResults([]);

    try {
      const data = await importAndAnalyzeRecentGames({
        platform,
        platformUsername: username.trim(),
        limit: 3,
        depth: 10,
      });

      setResults(data);
      setStatusMessage(`Analisi completata con successo! Trovate e analizzate ${data.length} partite.`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Errore: ${err.message || "Errore durante l'importazione"}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Analisi manuale da testo PGN incollato
  const handleAnalyzePgn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgnText.trim()) return;

    setLoading(true);
    setStatusMessage("Salvataggio PGN e avvio motore Stockfish...");
    setResults([]);

    try {
      const saved = await saveGameFromPgn({
        pgn: pgnText.trim(),
      });

      setStatusMessage("Partita registrata, esecuzione analisi Stockfish...");
      const analysisResult = await analyzeAndSaveGame(saved.game.id, 10);

      setResults([
        {
          game: saved.game,
          analysis: analysisResult.analysis,
          isExisting: saved.isExisting,
        },
      ]);
      setStatusMessage("Analisi completata!");
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Errore: ${err.message || "Errore durante l'analisi"}`);
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
            Importa le tue partite da Chess.com / Lichess o incolla un PGN per analizzarle con Stockfish.
          </p>
        </header>

        {/* Form Sezioni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sezione A: Import da piattaforma */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-emerald-400 flex items-center gap-2">
                <span>🌐</span> Importa da Piattaforma
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
                    placeholder="Es. hikaru, magnuscarlsen"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-all shadow-md"
                >
                  {loading ? "Analisi in corso..." : "Scarica e Analizza"}
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
                  {loading ? "Analisi in corso..." : "Analizza PGN"}
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

        {/* Risultati Analisi */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Risultati Analisi</h2>
            <div className="grid grid-cols-1 gap-6">
              {results.map((item, idx) => {
                const game = item.game;
                const analysis = item.analysis;
                return (
                  <div
                    key={game.id || idx}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
                      <div>
                        <div className="text-base font-semibold">
                          {game.whitePlayer || "Bianco"} vs {game.blackPlayer || "Nero"}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Risultato: {game.result || "N/D"} • Giocata il:{" "}
                          {game.playedAt ? new Date(game.playedAt).toLocaleDateString() : "N/D"}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-right">
                          <span className="text-xs text-zinc-400 block">Accuratezza Bianco</span>
                          <span className="text-lg font-bold text-emerald-400">
                            {analysis?.whiteAccuracy ? `${analysis.whiteAccuracy}%` : "-"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-zinc-400 block">Accuratezza Nero</span>
                          <span className="text-lg font-bold text-sky-400">
                            {analysis?.blackAccuracy ? `${analysis.blackAccuracy}%` : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dettaglio Blunder ed errori */}
                    {analysis?.summary && (
                      <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <div>
                          <div className="font-semibold text-zinc-300 mb-1">Mosse Bianco:</div>
                          <div className="text-zinc-400 space-y-0.5">
                            <div>★ Migliori: {analysis.summary.whiteStats?.best ?? 0}</div>
                            <div>▲ Inesattezze: {analysis.summary.whiteStats?.inaccuracy ?? 0}</div>
                            <div>✖ Errori: {analysis.summary.whiteStats?.mistake ?? 0}</div>
                            <div>💀 Blunder: {analysis.summary.whiteStats?.blunder ?? 0}</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-300 mb-1">Mosse Nero:</div>
                          <div className="text-zinc-400 space-y-0.5">
                            <div>★ Migliori: {analysis.summary.blackStats?.best ?? 0}</div>
                            <div>▲ Inesattezze: {analysis.summary.blackStats?.inaccuracy ?? 0}</div>
                            <div>✖ Errori: {analysis.summary.blackStats?.mistake ?? 0}</div>
                            <div>💀 Blunder: {analysis.summary.blackStats?.blunder ?? 0}</div>
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
