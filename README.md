# Apna Khata

A simple digital Khata for small shops. Keep customer balances, record goods and payments, and share bills on WhatsApp. The app is designed for shop owners who want clear screens and simple steps.

## What it does

- Add and search customers.
- Keep a separate Khata for each customer.
- Add goods by speaking, typing or entering them one by one.
- Record credit sales and payments.
- Make quick bills for customers who pay immediately.
- Remember common items and their prices.
- Share a bill through WhatsApp.
- Use English or Telugu.
- Keep working with saved data when internet is unavailable and sync later.

## Built with

React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, Cloud Firestore and a Progressive Web App setup.

## Run it on your computer

1. Install Node.js (use a supported current LTS version).
2. Download this repository.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and fill in your Firebase web app settings.
5. Run `npm run dev`.

## Check before publishing

Run `npm run lint`, `npm test` and `npm run build`.

## Important

The first sign-in needs internet. Voice input depends on the browser and may also need internet. Offline changes are saved on the current device and are sent to Firebase when the connection returns. Install the app from a supported browser.

This app is a shop record book. It does not connect to a bank or payment service and does not send WhatsApp messages by itself.
