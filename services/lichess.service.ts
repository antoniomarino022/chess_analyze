import type { ExternalGame } from "@/types";

/**
 * Client per le API pubbliche di Lichess.org (Read-only, rate limit standard)
 * Doc: https://lichess.org/api#tag/Games/operation/apiGamesUser
 */
export class LichessService {
  private static readonly BASE_URL = "https://lichess.org/api";
  private static readonly HEADERS = {
    "User-Agent": "ChessAnalyzeApp (github.com/chess-analyze)",
    Accept: "application/x-ndjson",
  };

  /**
   * Scarica le partite più recenti di un utente Lichess con PGN completo.
   * @param username Nickname su Lichess
   * @param max Numero massimo di partite (default: 10)
   */
  static async getRecentGames(
    username: string,
    max = 10
  ): Promise<ExternalGame[]> {
    const cleanUsername = username.trim().toLowerCase();
    const url = `${this.BASE_URL}/games/user/${cleanUsername}?max=${max}&pgnInJson=true&clocks=false&evals=false&opening=false`;

    const res = await fetch(url, { headers: this.HEADERS });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Utente Lichess non trovato: "${username}"`);
      }
      throw new Error(`Errore API Lichess (${res.status}): ${res.statusText}`);
    }

    const text = await res.text();
    if (!text.trim()) {
      return [];
    }

    // Lichess restituisce NDJSON (Newline Delimited JSON, una riga = un oggetto JSON)
    const lines = text.trim().split("\n");
    const games: ExternalGame[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        games.push({
          platform: "lichess",
          id: item.id,
          url: `https://lichess.org/${item.id}`,
          pgn: item.pgn || "",
          white: {
            username: item.players?.white?.user?.name || "Anonymous",
            rating: item.players?.white?.rating,
          },
          black: {
            username: item.players?.black?.user?.name || "Anonymous",
            rating: item.players?.black?.rating,
          },
          timeClass: item.speed,
          playedAt: new Date(item.createdAt),
        });
      } catch (err) {
        console.error("Errore parsing riga NDJSON Lichess:", err);
      }
    }

    // Ordina rigorosamente dalle più recenti alle più vecchie
    return games
      .filter((g) => Boolean(g.pgn))
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, max);
  }
}
