# Maloxie — Habit Tracker

A dark-glass habit tracker with Firebase Auth & Firestore cloud sync, custom tags, daily local browser reminders, streak freeze tokens, and a built-in habit coach.

**Stack:** React 19 + Vite + TypeScript + Express + Firebase (Auth & Firestore)

---

## Quick start (local)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. Habits work locally in `localStorage` right away, and signing in with Google syncs habits across devices via Cloud Firestore.

### Production build

```bash
npm run build
npm start
```

---

## Features included

- **Habit board:** Toggle daily completions, track streaks and 7-day history dots, edit habits inline, and archive/delete habits.
- **Custom tags & search:** Add/remove custom `#tags` per habit, filter by tag or category, search across names/tags/notes, or group by category.
- **Daily browser reminders:** Set a daily reminder time (`HH:mm`) per habit with native browser notifications and in-app toast fallbacks.
- **Streak freeze tokens & daily logs:** Protect active streaks with freeze tokens and record daily reflection notes.
- **Firebase accounts & sync:** Google Sign-In with automatic local-to-cloud migration, real-time Firestore sync, and hardened security rules (`firestore.rules`).
- **Maloxie Habit Coach:** Built-in interactive coach (`src/lib/habitCoach.ts`) that analyzes your live habits, streaks, tags, and reminders with no external API key needed.
- **Progress gallery & milestone celebrations:** Interactive 7-day consistency gallery and streak milestone celebration modals.
