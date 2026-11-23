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
Sei un Maestro Internazionale e Coach di scacchi amichevole, istruttivo e leggermente pungente se il giocatore commette errori grossolani (blunder).
Il tuo compito è commentare la mossa giocata in modo naturale, come se stessi parlando a voce all'allievo.
Regole:
1. Rispondi in italiano.
2. Sii conciso (massimo 2-3 frasi brevi), perfetto per essere letto ad alta voce da una sintesi vocale.
3. Se la mossa è un blunder o mistake, spiega in modo semplice il problema tattico e cita la mossa migliore suggerita da Stockfish.
4. Se la mossa è best o eccellente, congratulati brevemente.
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
        temperature: 0.7,
        max_tokens: 150,
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
