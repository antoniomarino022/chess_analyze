import type { ExternalGame } from "@/types";
import { ChessComGame,ChessComArchivesResponse,ChessComMonthlyGamesResponse } from "@/types/chess";
/**
 * Client per le API pubbliche di Chess.com (Read-only, non richiede token)
 * Doc: https://www.chess.com/news/view/published-data-api
 */
export class ChessComService {
  private static readonly BASE_URL = "https://api.chess.com/pub/player";
  private static readonly HEADERS = {
    "User-Agent": "ChessAnalyzeApp (github.com/chess-analyze)",
    Accept: "application/json",
  };

  /**
   * Recupera le ultime partite giocate da un utente (default: mese corrente).
   * @param username Nickname su Chess.com
   * @param limit Numero massimo di partite da restituire
   */
  static async getRecentGames(
    username: string,
    limit = 10
  ): Promise<ExternalGame[]> {
    const cleanUsername = username.trim().toLowerCase();

    // Recupera la lista di archivi mensili disponibili per l'utente
    const archivesRes = await fetch(
      `${this.BASE_URL}/${cleanUsername}/games/archives`,
      { headers: this.HEADERS }
    );

    if (!archivesRes.ok) {
      if (archivesRes.status === 404) {
        throw new Error(`Utente Chess.com non trovato: "${username}"`);
      }
      throw new Error(
        `Errore recupero archivi Chess.com (${archivesRes.status}): ${archivesRes.statusText}`
      );
    }

    const { archives }: ChessComArchivesResponse = await archivesRes.json();
    if (!archives || archives.length === 0) {
      return [];
    }

    // Prendiamo gli ultimi mesi a ritroso finché non abbiamo abbastanza partite
    const reversedArchives = [...archives].reverse();
    const rawGames: ChessComGame[] = [];

    for (const archiveUrl of reversedArchives) {
      if (rawGames.length >= limit) break;
      const gamesRes = await fetch(archiveUrl, { headers: this.HEADERS });
      if (gamesRes.ok) {
        const data: ChessComMonthlyGamesResponse = await gamesRes.json();
        if (data.games) {
          rawGames.push(...data.games);
        }
      }
    }

    // Ordiniamo rigorosamente dalle più recenti alle più vecchie
    const sorted = rawGames
      .filter((g) => Boolean(g.pgn))
      .sort((a, b) => b.end_time - a.end_time)
      .slice(0, limit);

    return sorted.map((g) => ({
      platform: "chesscom",
      id: g.url.split("/").pop() || String(g.end_time),
      url: g.url,
      pgn: g.pgn,
      white: {
        username: g.white.username,
        rating: g.white.rating,
      },
      black: {
        username: g.black.username,
        rating: g.black.rating,
      },
      timeClass: g.time_class,
      playedAt: new Date(g.end_time * 1000),
    }));
  }
}
