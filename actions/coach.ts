"use server";

import type { GenerateCoachCommentInput } from "@/types";

function fallbackComment(input: GenerateCoachCommentInput, reason: string) {
  const { move } = input;
  const playerName = move.color === "white" ? input.whitePlayer || "il Bianco" : input.blackPlayer || "il Nero";
  const hint = move.bestMove ? ` La mossa consigliata era ${move.bestMove}.` : "";
  return `${reason} ${playerName} ha giocato ${move.san}.${hint}`;
}

function safeErrorDetail(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as { error?: unknown; message?: unknown };
  const error = root.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const detail = error as { message?: unknown; type?: unknown; code?: unknown };
    const message = typeof detail.message === "string" ? detail.message : "";
    const code = typeof detail.code === "string" ? ` (${detail.code})` : "";
    return `${message}${code}`.trim();
  }
  return typeof root.message === "string" ? root.message : "";
}

/** Server Action: crea un commento per il coach senza esporre la chiave al browser. */
export async function generateCoachComment(input: GenerateCoachCommentInput): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY!.trim();
  if (!apiKey) {
    console.error("DeepSeek: DEEPSEEK_API_KEY is missing in this deployment runtime.");
    return fallbackComment(input, "Coach AI non configurato: verifica DEEPSEEK_API_KEY nell'ambiente del deployment e ridistribuisci.");
  }

  const systemPrompt = `
Sei il Maestro Denis, un carismatico Maestro Internazionale e Coach di scacchi dallo stile vivace, ironico, appassionato e teatrale.
Parli direttamente al giocatore. Non essere robotico o accademico. Varia il lessico e le esclamazioni.
Per gli errori gravi sii drammatico o ironico, spiega brevemente il pericolo e indica la mossa corretta.
Per le mosse brillanti o migliori esprimi entusiasmo; per le inesattezze sii pungente ma istruttivo.
Rispondi sempre in italiano naturale e colloquiale, in 2-3 frasi brevi adatte alla lettura vocale. Non iniziare con "Mossa" o "Il giocatore ha mosso". Cita la mossa migliore se il giocatore ha sbagliato.
`;
  const userContent = `
Giocatore: ${input.move.color === "white" ? input.whitePlayer || "il Bianco" : input.blackPlayer || "il Nero"} (${input.move.color})
Mossa giocata: ${input.move.san} (numero ${input.move.moveNumber})
Classificazione: ${input.move.classification}
Mossa migliore del motore: ${input.move.bestMove || "Nessuna alternativa netta"}
Valutazione: ${input.move.evaluation?.value ?? 0} (${input.move.evaluation?.type ?? "cp"})
FEN: ${input.move.fenAfter}
Genera il commento del coach.
`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt.trim() }, { role: "user", content: userContent.trim() }],
        temperature: 0.95,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
        max_tokens: 160,
      }),
      cache: "no-store",
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = safeErrorDetail(payload);
      console.error("DeepSeek API request failed", { status: response.status, detail });
      const reason = response.status === 401 || response.status === 403
        ? "DeepSeek ha rifiutato la chiave: ricontrolla DEEPSEEK_API_KEY su Vercel e ridistribuisci."
        : response.status === 402
          ? "DeepSeek non ha credito disponibile per questa richiesta."
          : response.status === 429
            ? "DeepSeek ha raggiunto il limite di richieste; riprova tra poco."
            : `DeepSeek ha risposto con errore ${response.status}${detail ? `: ${detail}` : "."}`;
      return fallbackComment(input, reason);
    }

    const data = payload as { choices?: Array<{ message?: { content?: string } }> } | null;
    return data?.choices?.[0]?.message?.content?.trim() || fallbackComment(input, "Il coach non ha ricevuto un commento valido.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "errore sconosciuto";
    console.error("DeepSeek network error:", message);
    return fallbackComment(input, "DeepSeek non è raggiungibile dal server. Verifica la rete e riprova.");
  }
}
