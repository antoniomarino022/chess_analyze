"use client";

import { useState } from "react";
import { importRecentGames } from "@/actions/import";
import { analyzeAndSaveGame } from "@/actions/analysis";
import { GameReplayModal } from "@/components/GameReplayModal";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useLanguage } from "@/components/LanguageProvider";
import { messages } from "@/lib/i18n";
import type { GameItem } from "@/types";

type HomeStatus =
  | { type: "searching"; username: string; platform: string }
  | { type: "importSuccess"; count: number }
  | { type: "noGames" | "importFailed" | "analyzing" | "analysisDone" | "analysisFailed" };

function getStatusText(status: HomeStatus, text: (typeof messages)[keyof typeof messages]["home"]): string {
  switch (status.type) {
    case "searching": return text.searching(status.username, status.platform);
    case "importSuccess": return text.importSuccess(status.count);
    case "noGames": return text.noGames;
    case "importFailed": return text.importFailed;
    case "analyzing": return text.analyzing;
    case "analysisDone": return text.analysisDone;
    case "analysisFailed": return text.analysisFailed;
  }
}

export default function Home() {
  const { language } = useLanguage();
  const text = messages[language].home;
  const [platform, setPlatform] = useState<"chesscom" | "lichess">("chesscom");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingGameId, setAnalyzingGameId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<HomeStatus | null>(null);
  const [gamesList, setGamesList] = useState<GameItem[]>([]);
  const [selectedGameForReplay, setSelectedGameForReplay] = useState<GameItem | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setStatusMessage({ type: "searching", username: username.trim(), platform: platform === "chesscom" ? "Chess.com" : "Lichess" });
    try {
      const data = await importRecentGames({ platform, platformUsername: username.trim(), limit: 10 });
      setGamesList(data);
      setStatusMessage(data.length ? { type: "importSuccess", count: data.length } : { type: "noGames" });
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage({ type: "importFailed" });
    } finally { setLoading(false); }
  };

  const handleAnalyzeGame = async (gameId: string) => {
    setAnalyzingGameId(gameId);
    setStatusMessage({ type: "analyzing" });
    try {
      const res = await analyzeAndSaveGame(gameId, 6);
      setGamesList((prev) => prev.map((item) => item.game.id === gameId ? { ...item, analysis: res.analysis } : item));
      setStatusMessage({ type: "analysisDone" });
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage({ type: "analysisFailed" });
    } finally { setAnalyzingGameId(null); }
  };

  const inputClass = "w-full rounded-xl border border-[#504432] bg-[#171511]/80 px-4 py-3 text-sm text-[#f4eee2] placeholder:text-[#777064] transition focus:border-[#bd985d] focus:bg-[#171511] focus:outline-none";
  const cardClass = "rounded-3xl border border-[#4b3c29] bg-[#211c16]/95 p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition duration-300 hover:border-[#82663e] sm:p-7";

  return (
    <main className="min-h-screen px-4 py-8 text-[#f4eee2] sm:px-7 sm:py-12">
      <div className="page-enter mx-auto max-w-5xl space-y-9">
        <header className="relative overflow-hidden rounded-[2rem] border border-[#675035] bg-gradient-to-br from-[#315640] via-[#263c2d] to-[#201a14] p-6 shadow-2xl shadow-black/30 sm:p-9">
          <div className="hero-knight pointer-events-none absolute -right-7 -top-5 select-none text-[150px] leading-none text-[#e6d4b5]/[0.055] sm:-right-2 sm:-top-12 sm:text-[220px]" aria-hidden="true">♞</div>
          <div className="relative z-10 mb-4 flex justify-end"><LanguageSwitch/></div>
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d2b77e]/35 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-[#e4cb98]"><span className="h-1.5 w-1.5 rounded-full bg-[#b6d38a]"/>{text.heroBadge}</div>
              <h1 className="hero-title text-4xl font-black tracking-tight text-[#f6eddd] sm:text-5xl">Chess <span className="text-[#e2c58a]">Analyze</span></h1>
              <p className="hero-subtitle mt-3 max-w-xl text-sm leading-6 text-[#d7d0c0] sm:text-base">{text.heroDescription}</p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-[#e8decc] sm:self-auto"><span className="text-xl text-[#d6b776]">♟</span><span><b className="block text-sm text-white">{text.gameLimit}</b>{text.perImport}</span></div>
          </div>
          <div className="hero-board relative mt-6 grid grid-cols-8 overflow-hidden rounded-lg border border-white/10 opacity-70 sm:mt-8 sm:rounded-xl" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} className={`aspect-square ${Math.floor(i / 8) % 2 === i % 8 % 2 ? "bg-[#dfcca6]/20" : "bg-[#10150f]/20"}`} />)}</div>
        </header>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]" aria-label={text.importAria}>
          <div style={{ animationDelay: "100ms" }} className={`card-enter ${cardClass}`}>
            <div className="mb-6 flex items-start justify-between gap-4"><div><div className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#ba965d]">{text.profileStep}</div><h2 className="text-xl font-bold">{text.importHeading}</h2><p className="mt-1 text-sm text-[#aaa294]">{text.importDescription}</p></div><span className="text-3xl text-[#b9955c]">♜</span></div>
            <form onSubmit={handleImport} className="space-y-5">
              <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#b9b0a1]">{text.platform}</legend><div className="grid grid-cols-2 gap-2">
                {(["chesscom", "lichess"] as const).map((p) => <label key={p} className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition duration-200 ${platform === p ? "border-[#b9955c] bg-[#665033]/30 text-[#f2dfb7] shadow-[inset_0_0_0_1px_#b9955c33]" : "border-[#4b4030] bg-black/10 text-[#aaa294] hover:border-[#766044] hover:text-[#eee3d0]"}`}><input className="sr-only" type="radio" name="platform" value={p} checked={platform === p} onChange={() => setPlatform(p)}/><span className="text-lg">{p === "chesscom" ? "♞" : "♟"}</span>{p === "chesscom" ? "Chess.com" : "Lichess"}{platform === p && <span className="ml-auto text-[#bad58b]">✓</span>}</label>)}
              </div></fieldset>
              <div><label htmlFor="username" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#b9b0a1]">{text.username}</label><input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={text.usernamePlaceholder} autoComplete="username" className={inputClass}/></div>
              <button type="submit" disabled={loading || !username.trim()} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#46714e] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#56875e] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"><span>{loading ? text.searchingButton : text.searchButton}</span><span className="transition-transform group-hover:translate-x-1">{loading ? "◌" : "→"}</span></button>
            </form>
          </div>
          <aside style={{ animationDelay: "190ms" }} className={`card-enter ${cardClass}`} aria-label={text.howItWorks}>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#665238] bg-[#30271c] text-xl text-[#d6b776]" aria-hidden="true">♞</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ba965d]">{text.howItWorksEyebrow}</p>
                <h2 className="mt-1 text-xl font-bold">{text.howItWorks}</h2>
              </div>
            </div>
            <p className="mb-5 text-sm leading-6 text-[#aaa294]">{text.howItWorksDescription}</p>
            <ol className="space-y-4">
              {[
                { title: text.howItWorksProfileTitle, description: text.howItWorksProfileDescription, icon: "♟" },
                { title: text.howItWorksGameTitle, description: text.howItWorksGameDescription, icon: "♜" },
                { title: text.howItWorksReviewTitle, description: text.howItWorksReviewDescription, icon: "♞" },
              ].map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#59472e] bg-[#30271c] text-sm text-[#d6b776]" aria-hidden="true">{step.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#e9dfcf]"><span className="mr-2 font-mono text-[10px] text-[#ba965d]">0{index + 1}</span>{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#aaa294]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-[#4b3c29] pt-4 text-xs font-medium text-[#c8b58c]">
              <span className="mr-2 text-[#d6b776]" aria-hidden="true">♙</span>{text.howItWorksFooter}
            </div>
          </aside>
        </section>

        {statusMessage && <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-2xl border border-[#665338] bg-[#2b241a]/95 p-4 text-sm text-[#e8ddc9] shadow-lg"><span className="mt-0.5 text-lg text-[#d5b678]">♟</span><span>{getStatusText(statusMessage, text)}</span></div>}

        {gamesList.length > 0 && <section className="space-y-4" aria-label={text.gameListAria}><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-[#ba965d]">{text.yourGames}</div><h2 className="text-2xl font-bold">{text.availableGames} <span className="text-[#bc9c66]">({gamesList.length})</span></h2></div><span className="text-sm text-[#aaa294]">{text.chooseGame}</span></div>
          <div className="grid gap-3">{gamesList.map((item, index) => {
            const { game, analysis } = item;
            const isAnalyzing = analyzingGameId === game.id;
            return <article key={game.id} style={{ animationDelay: `${Math.min(index * 70, 490)}ms` }} className="game-enter group rounded-2xl border border-[#4b3c29] bg-[#211c16]/95 p-5 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:border-[#856844] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-5"><div className="flex min-w-0 items-center gap-4"><div className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#655039] bg-[#30271c] text-2xl text-[#c5a367] sm:grid">♟</div><div className="min-w-0"><h3 className="truncate text-base font-bold text-[#f0e8d9]">{game.whitePlayer || text.white} <span className="font-normal text-[#928777]">{text.versus}</span> {game.blackPlayer || text.black}</h3><p className="mt-1 text-xs text-[#a9a091]">{text.result} <span className="font-mono text-[#eee2cc]">{game.result || text.unknown}</span><span className="mx-2 text-[#655a49]">·</span>{game.playedAt ? new Date(game.playedAt).toLocaleDateString(language === "it" ? "it-IT" : "en-US") : text.dateUnavailable}</p></div></div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{analysis ? <><div className="flex flex-1 items-center gap-4 rounded-xl border border-[#4d4231] bg-[#171511]/70 px-3 py-2 sm:flex-none"><div><span className="block text-[9px] font-bold uppercase tracking-wider text-[#918777]">{text.white}</span><span className="text-sm font-bold text-[#e5d0a6]">{analysis.whiteAccuracy}%</span></div><span className="h-7 w-px bg-[#4d4231]"/><div><span className="block text-[9px] font-bold uppercase tracking-wider text-[#918777]">{text.black}</span><span className="text-sm font-bold text-[#b8c99a]">{analysis.blackAccuracy}%</span></div></div><button onClick={() => setSelectedGameForReplay(item)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#46714e] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#56875e] sm:flex-none"><span>♞</span>{text.reviewGame}</button></> : <button onClick={() => handleAnalyzeGame(game.id)} disabled={isAnalyzing || Boolean(analyzingGameId)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#5b4a31] bg-[#30271c] px-4 py-3 text-xs font-bold text-[#ebd6af] transition hover:border-[#a5814c] hover:bg-[#3e3020] disabled:cursor-wait disabled:opacity-55 sm:w-auto">{isAnalyzing ? <><span className="animate-spin">◌</span>{text.analyzingGame}</> : <>♙ {text.analyzeGame}</>}</button>}</div>
              </div>
              {Boolean(analysis?.summary) && <details className="mt-4 border-t border-[#463a2a] pt-3"><summary className="cursor-pointer text-xs font-semibold text-[#c6b897] transition hover:text-white">{text.moveStats} <span className="ml-1 text-[#998567]">↓</span></summary><div className="mt-3 grid grid-cols-2 gap-3">{(["white", "black"] as const).map((side) => { const stats = (analysis?.summary as Record<string, Record<string, number>> | null)?.[`${side}Stats`]; return <div key={side} className="rounded-xl border border-[#443927] bg-[#171511]/60 p-3"><div className="mb-2 text-xs font-bold text-[#e1d1b3]">{side === "white" ? text.white : text.black}</div><div className="space-y-1 text-xs text-[#aaa294]"><div>{text.best} <span className="float-right text-[#c6d39f]">{String(stats?.best ?? 0)}</span></div><div>{text.inaccuracies} <span className="float-right text-[#d7c479]">{String(stats?.inaccuracies ?? 0)}</span></div><div>{text.mistakes} <span className="float-right text-[#d69b65]">{String(stats?.mistakes ?? 0)}</span></div><div>{text.blunders} <span className="float-right text-[#ce8176]">{String(stats?.blunders ?? 0)}</span></div></div></div>; })}</div></details>}
            </article>;
          })}</div>
        </section>}
        <footer className="flex items-center justify-center gap-2 pb-2 text-[11px] text-[#857d70]"><span className="text-[#b9945c]">♞</span> {text.footer}</footer>
      </div>
      {selectedGameForReplay?.analysis && <GameReplayModal game={selectedGameForReplay.game} analysis={selectedGameForReplay.analysis} onClose={() => setSelectedGameForReplay(null)}/>}
    </main>
  );
}
