# Apna Khata - Setup Guide

This guide explains how to run Apna Khata on your computer.

## 1. What you need

- Node.js (a supported current LTS release)
- A Firebase project
- Internet for the first sign-in and initial setup

## 2. Download and install

```bash
git clone https://github.com/SSVP-debug/Apna_Khata.git
cd Apna_Khata
npm install
```

## 3. Add Firebase settings

1. Open the Firebase Console and create a project.
2. Add a Web App to that project.
3. In Authentication, turn on Email/Password and Google sign-in.
4. Create a Cloud Firestore database.
5. Copy `.env.example` to `.env`.
6. Fill in the four `VITE_FIREBASE_*` values from your Firebase Web App settings.
7. Keep `.env` private. Do not upload it to GitHub.

## 4. Publish database rules

Install the Firebase command-line tool, sign in and select your Firebase project.

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

## 5. Run the app

```bash
npm run dev
```

## 6. Check your changes

```bash
npm run check
```

This runs code checks, tests and a production build.

## 7. Deploy

The repository is set up for a static site host such as Cloudflare Pages.

- Build command: `npm run build`
- Output folder: `dist`
- Add the four Firebase environment values in the hosting dashboard.
- Add the deployed site domain to Firebase Authentication's allowed domains.

## 8. Before using it in a shop

Test adding a customer, adding goods, recording a payment, cancelling a sale, sharing a bill and using the app with internet turned off and back on.

The first sign-in needs internet. Voice input depends on browser support and may need internet. Offline records are saved on the device and sent to Firebase when the connection returns.
