"use client";

import Script from "next/script";
import { useCallback } from "react";

export function 

TelegramMiniApp() {
  const initializeTelegramApp = useCallback(() => {
    const telegramApp = window.Telegram?.WebApp;
    if (!telegramApp) return;

    telegramApp.ready();
    telegramApp.expand();
    telegramApp.disableVerticalSwipes?.();
    const appBackground = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    telegramApp.setHeaderColor?.(appBackground);
    telegramApp.setBackgroundColor?.(appBackground);
  }, []);

  const handleScriptError = useCallback(() => {
    console.error("Could not load the Telegram Web App SDK.");
  }, []);

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onReady={initializeTelegramApp}
      onError={handleScriptError}
    />
  );
}
