import { randomUUID } from "node:crypto";
import WebSocket from "ws";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const EDGE_COPYRIGHT = "Copyright (C) Microsoft Corporation. All rights reserved.";
const CHROMIUM_FULL_VERSION = "143.0.3650.96";
const CHROMIUM_MAJOR = CHROMIUM_FULL_VERSION.split(".")[0];

const WS_ENDPOINT =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const TIMEOUT_MS = 25_000;

type SwapMultipliers = {
  swappedWord: number;
  swappedSum: number;
  swappedProduct: number;
};
const SWAP_FIRST_WORD: SwapMultipliers = {
  swappedWord: 0xef0569fb,
  swappedSum: 0x76f50f34,
  swappedProduct: 0xc3efea97,
};
const SWAP_SECOND_WORD: SwapMultipliers = {
  swappedWord: 0xc31713db,
  swappedSum: 0x1881ce3c,
  swappedProduct: 0x35bd1ec9,
};
const MIX_FIRST_WORD = [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83];
const MIX_SECOND_WORD = [0xa27416f5, 0xd38396ff, 0x7c932b89, 0xbfa49f69];

function swapHalves(value: number): number {
  return ((value << 16) | (value >>> 16)) >>> 0;
}

function swapTerm(word: number, key: number, multipliers: SwapMultipliers): number {
  const sum = Math.imul(word, key) + Math.imul(swapHalves(word), multipliers.swappedWord);
  const product = Math.imul(swapHalves(sum), multipliers.swappedSum) >>> 0;
  return (Math.imul(swapHalves(product), multipliers.swappedProduct) + product) >>> 0;
}

function swapAndMultiply(value: number, multipliers: number[]): number {
  for (const multiplier of multipliers) {
    value = Math.imul(swapHalves(value), multiplier) >>> 0;
  }
  return value;
}

function cs64(message: Uint8Array, digest: Uint8Array): Uint8Array {
  const digestView = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);
  const firstKey = (digestView.getUint32(0, true) | 1) >>> 0;
  const secondKey = (digestView.getUint32(4, true) | 1) >>> 0;

  const padded = new Uint8Array(Math.ceil(message.length / 8) * 8);
  padded.set(message);
  const words = new DataView(padded.buffer);

  let swapSum = 0;
  let lastSwap = 0;
  let mix = 0;
  let mixSum = 0;
  for (let offset = 0; offset < padded.length; offset += 8) {
    const firstWord = words.getUint32(offset, true);
    const secondWord = words.getUint32(offset + 4, true);

    const firstSwap = swapTerm(firstWord, firstKey, SWAP_FIRST_WORD);
    lastSwap = swapTerm(secondWord, secondKey, SWAP_SECOND_WORD);
    swapSum = (swapSum + firstSwap + lastSwap) >>> 0;

    mix = swapAndMultiply(Math.imul(mix + firstWord, firstKey), MIX_FIRST_WORD);
    mixSum = (mixSum + mix) >>> 0;
    mix = swapAndMultiply(Math.imul(mix + secondWord, secondKey), MIX_SECOND_WORD);
    mixSum = (mixSum + mix) >>> 0;
  }

  const checksum = new Uint8Array(8);
  const checksumView = new DataView(checksum.buffer);
  checksumView.setUint32(0, lastSwap ^ mix, true);
  checksumView.setUint32(4, swapSum ^ mixSum, true);
  return checksum;
}

function toUpperHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function hashSecMsGecV2(ticksAndToken: string): Promise<string> {
  const message = new TextEncoder().encode(EDGE_COPYRIGHT + ticksAndToken);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", message));
  return `${toUpperHex(cs64(message, digest))}-${toUpperHex(digest)}`;
}

async function generateSecMsGecV2Token(): Promise<string> {
  const ticks = Math.floor(Date.now() / 1000) + 11644473600;
  const rounded = ticks - (ticks % 300);
  const windowsTicks = rounded * 10000000;
  return hashSecMsGecV2(`${windowsTicks}${TRUSTED_CLIENT_TOKEN}`);
}

const XML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c]);

const stripControlChars = (s: string): string =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

function buildSsml(text: string, voice: string, rate: string, pitch: string): string {
  const lang = voice.split("-").slice(0, 2).join("-");
  const body = escapeXml(stripControlChars(text).trim());
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${escapeXml(lang)}'>` +
    `<voice name='${escapeXml(voice)}'>` +
    `<prosody pitch='${escapeXml(pitch)}' rate='${escapeXml(rate)}'>${body}</prosody>` +
    `</voice></speak>`
  );
}

const speechConfigMessage = (): string =>
  `X-Timestamp:${new Date().toISOString()}\r\n` +
  `Content-Type:application/json; charset=utf-8\r\n` +
  `Path:speech.config\r\n\r\n` +
  JSON.stringify({
    context: {
      synthesis: {
        audio: {
          metadataoptions: {
            sentenceBoundaryEnabled: "false",
            wordBoundaryEnabled: "false",
          },
          outputFormat: OUTPUT_FORMAT,
        },
      },
    },
  });

const ssmlMessage = (requestId: string, ssml: string): string =>
  `X-RequestId:${requestId}\r\n` +
  `Content-Type:application/ssml+xml\r\n` +
  `X-Timestamp:${new Date().toISOString()}\r\n` +
  `Path:ssml\r\n\r\n${ssml}`;

function extractAudio(frame: Buffer): Buffer | null {
  if (frame.length < 2) return null;
  const headerLength = frame.readUInt16BE(0);
  if (frame.length < 2 + headerLength) return null;
  const header = frame.toString("utf8", 2, 2 + headerLength);
  if (!header.includes("Path:audio")) return null;
  const payload = frame.subarray(2 + headerLength);
  return payload.length > 0 ? payload : null;
}

export async function synthesizeMicrosoftNeuralTTS(
  text: string,
  voice = "it-IT-DiegoNeural",
  rate = "+0%",
  pitch = "+0Hz"
): Promise<Buffer> {
  const secMsGec = await generateSecMsGecV2Token();
  const connectionId = randomUUID().replace(/-/g, "");
  const requestId = randomUUID().replace(/-/g, "");

  const url =
    `${WS_ENDPOINT}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${secMsGec}` +
    `&Sec-MS-GEC-Version=2-${CHROMIUM_FULL_VERSION}` +
    `&ConnectionId=${connectionId}`;

  const ssml = buildSsml(text, voice, rate, pitch);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;

    const ws = new WebSocket(url, {
      headers: {
        "User-Agent":
          `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ` +
          `Chrome/${CHROMIUM_MAJOR}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR}.0.0.0`,
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
      },
    });

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      if (err) reject(err);
      else resolve(Buffer.concat(chunks));
    };

    const timer = setTimeout(
      () => finish(new Error(`Timeout sintesi vocale dopo ${TIMEOUT_MS} ms`)),
      TIMEOUT_MS
    );

    ws.on("open", () => {
      ws.send(speechConfigMessage());
      ws.send(ssmlMessage(requestId, ssml));
    });

    ws.on("message", (data: WebSocket.RawData, isBinary: boolean) => {
      if (isBinary) {
        const audio = Buffer.isBuffer(data) ? extractAudio(data) : null;
        if (audio) chunks.push(audio);
      } else if (data.toString().includes("Path:turn.end")) {
        finish();
      }
    });

    ws.on("error", (err) => finish(err));

    ws.on("close", () => {
      if (chunks.length > 0) {
        finish();
      } else {
        finish(new Error("Connessione chiusa prima della fine della sintesi"));
      }
    });
  });
}
