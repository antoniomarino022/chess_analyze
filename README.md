This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Telegram Mini App

The app loads Telegram's Web App SDK when opened inside Telegram. It signals that
the app is ready, expands the Mini App, and applies the app's dark header and
background colors. The regular website continues to work outside Telegram.

To publish it as a Mini App:

1. Deploy the site to a public HTTPS URL (for example, on Vercel).
2. Open [@BotFather](https://t.me/BotFather) and select your bot, or create one
   with `/newbot`.
3. In BotFather, open **Bot Settings → Configure Mini App → Enable Mini App**
   and set the deployed URL as the Main Mini App URL.
4. Optionally configure a menu button in BotFather to make the app easier to
   launch from the bot chat.
5. Open the bot in Telegram and launch the Mini App to test it.

This integration does not use Telegram identity or authenticate users. Do not
trust `initDataUnsafe` as authentication; validating Telegram users requires a
server-side check of the signed `initData` using the bot token, stored only as a
server-side secret.
