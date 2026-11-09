# Apna Khata — setup (Firebase, free Spark plan)

## 1. Copy into your repo (C:\bunny\projects\Apna_Khata)
Copy these over your existing files: `src/`, `public/`, `index.html`, `vite.config.ts`,
`firestore.rules`, `firebase.json`, `.env.example`.
Delete the old `src/App.css` and `src/assets/` if present.

## 2. Install
```
npm i firebase
npm i -D tailwindcss @tailwindcss/vite vite-plugin-pwa vitest
```
Add to package.json scripts: `"test": "vitest run"`

## 3. Firebase (manual, console.firebase.google.com)
1. Add project -> Add web app -> copy config.
2. Authentication -> Sign-in method -> enable Email/Password.
3. Firestore Database -> Create (region asia-south1, production mode).
4. Copy `.env.example` to `.env`, fill the 4 values. NEVER commit `.env`.
5. Publish rules:
```
npm i -g firebase-tools
firebase login
firebase use --add      # pick your project
firebase deploy --only firestore:rules
```

## 4. Run
```
npm run dev
npm run lint && npm test && npm run build
```

## 5. Deploy (Cloudflare Pages)
Connect GitHub repo. Build: `npm run build`, output: `dist`.
Add the 4 `VITE_FIREBASE_*` variables in Pages settings.
In Firebase Auth -> Settings -> Authorized domains, add your `*.pages.dev` domain.

## 6. Must-do tests before real use
- Airplane mode: add customer, bill, payment -> reload -> reconnect -> each appears once.
- Two accounts: confirm neither can see the other's data.
- Install PWA on Android Chrome.
