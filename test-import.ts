import { ChessComService } from "./services/chess-com.service";
import { LichessService } from "./services/lichess.service";
import { parsePgn } from "./lib/chess/pgn";
import { analyzeGamePgn } from "./lib/stockfish/analyzer";

// Inserisci qui il tuo username di Chess.com o Lichess
const CHESS_COM_USER = "hikaru"; // Cambia con il tuo username per testare!
const LICHESS_USER = "thibault"; // Cambia con il tuo username per testare!

async function testImportAndAnalyze() {
  console.log(`=== 1. SCARICAMENTO PARTITE DA CHESS.COM (${CHESS_COM_USER}) ===`);
  try {
    const chessComGames = await ChessComService.getRecentGames(CHESS_COM_USER, 2);
    console.log(`Trovate ${chessComGames.length} partite.`);
    if (chessComGames.length > 0) {
      const g = chessComGames[0];
      console.log(`\nUltima partita: ${g.white.username} vs ${g.black.username} (${g.timeClass || "standard"})`);
      console.log(`Data: ${g.playedAt.toISOString()}`);
      console.log(`URL: ${g.url}`);

      console.log("\n=== 2. ANALISI CON STOCKFISH DELLA PARTITA SCARICATA ===");
      const parsed = parsePgn(g.pgn, CHESS_COM_USER);
      console.log(`Mosse estratte: ${parsed.moves.length}`);
      console.log(`Colore assegnato all'utente (${CHESS_COM_USER}): ${parsed.userColor}`);

      console.log("\nAvvio Stockfish a depth 10...");
      const analysis = await analyzeGamePgn(g.pgn, 10, (curr, tot) => {
        process.stdout.write(`Analizzando mossa ${curr}/${tot}\r`);
      });

      console.log("\n\nRisultati Analisi:");
      console.log(`- Accuratezza Bianco (${g.white.username}): ${analysis.whiteAccuracy}%`);
      console.log(`- Accuratezza Nero (${g.black.username}): ${analysis.blackAccuracy}%`);
      console.log("- Statistiche mosse Bianco:", analysis.summary.whiteStats);
      console.log("- Statistiche mosse Nero:", analysis.summary.blackStats);
    }
  } catch (error) {
    console.error("Errore Chess.com:", error);
  }

  console.log(`\n=== 3. SCARICAMENTO PARTITE DA LICHESS (${LICHESS_USER}) ===`);
  try {
    const lichessGames = await LichessService.getRecentGames(LICHESS_USER, 2);
    console.log(`Trovate ${lichessGames.length} partite.`);
    if (lichessGames.length > 0) {
      const g = lichessGames[0];
      console.log(`Partita: ${g.white.username} vs ${g.black.username}`);
      console.log(`URL: ${g.url}`);
    }
  } catch (error) {
    console.error("Errore Lichess:", error);
  }
}

testImportAndAnalyze().catch(console.error);
