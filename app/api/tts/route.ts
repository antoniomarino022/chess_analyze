import { NextRequest, NextResponse } from "next/server";
import { synthesizeMicrosoftNeuralTTS } from "@/lib/tts/microsoft-edge";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { text, language = "it" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Testo mancante" }, { status: 400 });
    }

    const voice = language === "it" ? "it-IT-DiegoNeural" : "en-US-ChristopherNeural";
    const mp3Buffer = await synthesizeMicrosoftNeuralTTS(text, voice);

    return new Response(new Uint8Array(mp3Buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": mp3Buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("[Microsoft TTS Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Errore durante la sintesi vocale neurale" },
      { status: 500 }
    );
  }
}
