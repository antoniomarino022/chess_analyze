"use server";

import type { GenerateCoachCommentInput } from "@/types";

/**
 * Server Action: Genera un commento vocale/testuale in stile Coach di Scacchi
 * utilizzando le API dirette di DeepSeek.
 */
export async function generateCoachComment(
  input: GenerateCoachCommentInput
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  const { move, whitePlayer, blackPlayer } = input;
  const playerName =
    move.color === "white"
      ? whitePlayer || "il Bianco"
      : blackPlayer || "il Nero";

  // Se non c'è la chiave, forniamo un commento di fallback chiaro
  if (!apiKey) {
    return `Mossa ${move.san} di ${playerName}. Valutata come ${move.classification} da Stockfish.`;
  }

  const systemPrompt = `
Sei il Maestro Denis, un carismatico Maestro Internazionale e Coach di scacchi dallo stile vivace, ironico, appassionato e teatrale (in stile Chess.com Game Review / GothamChess / Daniel Naroditsky).

Parli direttamente al giocatore guardandolo negli occhi. NON essere mai robotico, monotono o accademico. Varia sempre il lessico e le esclamazioni!

STILE E PERSONALITÀ:
- BLUNDER / SVISTE GRAVI: Sii drammatico o ironico ("Mamma mia, cosa abbiamo appena visto!", "Regalo di Natale in anticipo!", "Un disastro tattico su tutta la linea!"). Spiega in una riga fulminea la trappola in cui è caduto o cosa ha lasciato indifeso, e grida la mossa corretta.
- MOSSE BRILLANTI / BEST: Esalta la mossa con entusiasmo contagioso ("Magistrale!", "Calcolo da manuale!", "Visione di gioco pura!").
- INESATTEZZE / MISTAKE: Pungente ma istruttivo ("Idea comprensibile, ma troppo passiva", "Stai regalando l'iniziativa all'avversario").
- TEORIA / BOOK: Riconosci l'apertura con eleganza ("Teoria classica, preparazione solida").

REGOLE RIGIDE:
1. Rispondi SEMPRE in italiano naturale e colloquiale.
2. Lunghezza: 2-3 frasi incisive e concise, ideali per la recitazione vocale.
3. NON iniziare mai con "Mossa..." o "Il giocatore ha mosso...". Entra subito nell'emozione del momento!
4. Cita la mossa migliore se il giocatore ha sbagliato.
`;

  const userContent = `
Giocatore: ${playerName} (${move.color})
Mossa giocata: ${move.san} (numero mossa ${move.moveNumber})
Classificazione Stockfish: ${move.classification}
Mossa migliore del motore: ${move.bestMove || "Nessuna alternativa netta"}
Punteggio valutazione: ${move.evaluation?.value ?? 0} (${move.evaluation?.type ?? "cp"})
FEN attuale: ${move.fenAfter}

Genera il tuo commento da coach:
`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt.trim() },
          { role: "user", content: userContent.trim() },
        ],
        temperature: 0.95,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
        max_tokens: 160,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return `Mossa ${move.san}. Classificata come ${move.classification}. Mossa consigliata: ${move.bestMove || "-"}.`;
    }

    const data = await response.json();
    const comment = data.choices?.[0]?.message?.content?.trim();

    return (
      comment ||
      `Hai giocato ${move.san}. Stockfish consigliava ${move.bestMove || "un'altra linea"}.`
    );
  } catch (err: any) {
    console.error("Errore chiamata DeepSeek:", err);
    return `Mossa ${move.san}: ${move.classification}.`;
  }
}
