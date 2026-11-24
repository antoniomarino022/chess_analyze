import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function setTelegramWebhook() {
  const botToken = process.env.BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.MINI_APP_URL ?? "https://chessanalyze.vercel.app";

  if (!botToken) {
    console.error("Set BOT_TOKEN in .env.local or .env before registering the webhook.");
    process.exitCode = 1;
    return;
  }

  if (!webhookSecret || !/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret)) {
    console.error("Set TELEGRAM_WEBHOOK_SECRET to 1-256 characters using only letters, numbers, _ or -.");
    process.exitCode = 1;
    return;
  }

  let webhookUrl: URL;
  try {
    webhookUrl = new URL("/api/telegram/webhook", appUrl);
  } catch {
    console.error("MINI_APP_URL must be a valid HTTPS URL.");
    process.exitCode = 1;
    return;
  }

  if (webhookUrl.protocol !== "https:") {
    console.error("MINI_APP_URL must use HTTPS.");
    process.exitCode = 1;
    return;
  }

  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.toString(),
        secret_token: webhookSecret,
        allowed_updates: ["message"],
      }),
    });
  } catch {
    console.error("Could not reach the Telegram Bot API to register the webhook.");
    process.exitCode = 1;
    return;
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    console.error("Telegram Bot API returned an invalid response.");
    process.exitCode = 1;
    return;
  }

  if (!response.ok || !isRecord(result) || result.ok !== true) {
    const description = isRecord(result) && typeof result.description === "string"
      ? result.description
      : `HTTP ${response.status}`;
    console.error(`Telegram webhook registration failed: ${description}`);
    process.exitCode = 1;
    return;
  }

  console.log("Telegram webhook registered successfully.");
}

void setTelegramWebhook();
