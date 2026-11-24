import { timingSafeEqual } from "node:crypto";
import type { TelegramStartCommand } from "@/types/telegram";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStartCommand(update: unknown): TelegramStartCommand | null {
  if (!isRecord(update) || !isRecord(update.message)) return null;

  const { message } = update;
  if (
    typeof message.text !== "string" ||
    !/^\/start(?:@[A-Za-z0-9_]+)?(?:\s|$)/.test(message.text) ||
    !isRecord(message.chat) ||
    typeof message.chat.id !== "number" ||
    !Number.isSafeInteger(message.chat.id)
  ) {
    return null;
  }

  const languageCode = isRecord(message.from) && typeof message.from.language_code === "string"
    ? message.from.language_code
    : "";

  return {
    chatId: message.chat.id,
    language: languageCode.toLowerCase().startsWith("en") ? "en" : "it",
  };
}

function matchesSecret(received: string, expected: string): boolean {
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

export async function POST(request: Request) {
  const botToken = process.env.BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken || !webhookSecret) {
    console.error("Telegram webhook is missing required server environment variables.");
    return new Response("Telegram webhook is not configured.", { status: 500 });
  }

  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!receivedSecret || !matchesSecret(receivedSecret, webhookSecret)) {
    return new Response("Unauthorized.", { status: 401 });
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  const startCommand = getStartCommand(update);
  if (!startCommand) return new Response("OK");

  const appUrl = process.env.MINI_APP_URL ?? "https://chessanalyze.vercel.app";
  let miniAppUrl: URL;
  try {
    miniAppUrl = new URL(appUrl);
  } catch {
    console.error("MINI_APP_URL must be a valid HTTPS URL.");
    return new Response("Telegram Mini App URL is not configured.", { status: 500 });
  }

  if (miniAppUrl.protocol !== "https:") {
    console.error("MINI_APP_URL must use HTTPS.");
    return new Response("Telegram Mini App URL must use HTTPS.", { status: 500 });
  }

  let telegramResponse: Response;
  try {
    telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: startCommand.chatId,
        text: startCommand.language === "en"
          ? "Welcome to Chess Analyze! Review your games"
          : "Benvenuto su Chess Analyze! Analizza le tue partite",
        reply_markup: {
          inline_keyboard: [[{
            text: startCommand.language === "en" ? "Open Chess Analyze" : "Apri Chess Analyze",
            web_app: { url: miniAppUrl.toString() },
          }]],
        },
      }),
    });
  } catch {
    console.error("Could not reach the Telegram Bot API to reply to /start.");
    return new Response("Could not send Telegram reply.", { status: 502 });
  }

  let result: unknown;
  try {
    result = await telegramResponse.json();
  } catch {
    console.error("Telegram Bot API returned an invalid response.");
    return new Response("Invalid Telegram API response.", { status: 502 });
  }

  if (!telegramResponse.ok || !isRecord(result) || result.ok !== true) {
    const description = isRecord(result) && typeof result.description === "string"
      ? result.description
      : `HTTP ${telegramResponse.status}`;
    console.error(`Telegram sendMessage failed: ${description}`);
    return new Response("Telegram could not send the reply.", { status: 502 });
  }

  return new Response("OK");
}
