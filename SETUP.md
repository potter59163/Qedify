# QEDify — Setup Guide

## Prerequisites

- **Node.js** 20 or later — https://nodejs.org
- **Git** — https://git-scm.com
- Optional: the **Expo Go** app, to run on a phone

## Install and run

```bash
git clone https://github.com/potter59163/Qedify.git
cd Qedify
npm install
npm run web
```

`npm run web` opens the app at http://localhost:8081. The layout adapts to the window: phone, tablet and desktop each get their own navigation and column layout.

Other targets: `npm start` (QR code for Expo Go), `npm run ios`, `npm run android`.

## AI coach (optional)

The app is fully playable without it: hints, feedback and insights fall back to the built-in rule-based versions.

To turn the Claude-powered coach on locally:

```bash
cp .env.example .env.local
```

Then put your key in `.env.local` as `ANTHROPIC_API_KEY=...` and restart `npm run web`. The key is read only by the server code in `server/coach.js`; it is never bundled into the app. Do not prefix it with `EXPO_PUBLIC_`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | server | Claude API key for the coach |
| `CLAUDE_MODEL` | server, optional | Model override (default `claude-opus-5-5`) |
| `EXPO_PUBLIC_API_BASE` | client, native builds only | Origin that hosts `/api/coach` |

## Deploy (Vercel)

The repo is configured for Vercel (`vercel.json`): every page is pre-rendered to static HTML in `dist/` and served with clean URLs, `/api/coach` runs as a serverless function, and unknown paths get the app's own 404 page.

Set `ANTHROPIC_API_KEY` under Project → Settings → Environment Variables, then deploy.

If the site is not served from `https://qedify.vercel.app`, set `EXPO_PUBLIC_SITE_URL` to its public origin at build time and update the two URLs in `public/robots.txt` and `public/sitemap.xml`. They feed the canonical links, the social cards and the sitemap.

## Scripts

| Command | Description |
| --- | --- |
| `npm run web` | Dev server in the browser |
| `npm run verify` | Physics self-check of every mission generator |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run build:web` | Pre-render the site to `dist/` |
| `node scripts/serve-dist.js 4173` | Preview the production build locally |

## Language

The app starts in Thai when the browser language is Thai, otherwise in English. Learners switch in Settings → Language; `/th` opens the Thai landing page and switches the app to Thai.

Every learner-facing string is written as `L("English", "ไทย")` (`useL()` in components, `pick(lang)` in the engine). `npm run verify` fails if a mission string has no Thai.

## Collecting evaluation data

1. Learners play, then answer the survey (Settings → Research and feedback, or the card on the home screen after four missions). Teachers pick the teacher role in the same survey.
2. Each learner exports a file: Settings → Export my learning data → Full data (JSON). The file has no name or school unless the learner chooses "With my name".
3. Put the files in one folder and run:

```bash
npm run aggregate -- path/to/exports
```

This writes `participants.csv` (one row per learner), `likert.csv` (n, mean, SD and agreement per survey item) and `misconceptions.csv`, and prints the headline numbers.

## Offline use

`npm run build:web` also writes `dist/sw.js`, a service worker that caches every page and script after the first visit. Missions, the lab and the briefings then work without a connection; only the AI coach needs the network. The service worker is not used by `npm run web`.

## Adding a mission

1. Add a `MissionDef` to `lib/engine/missions-a.ts` or `missions-b.ts` and include it in the exported list. The order in `lib/engine/catalog.ts` is the unlock order.
2. Add its Thai title to `MISSION_TH` in `lib/engine/catalog.ts`.
3. Add an independent physics check for its id in `scripts/verify-missions.ts`.
4. Optional: add a handler per step in `lib/engine/consequence.ts` so a wrong answer plays out in the simulation.
5. Run `npm run verify`.

## Troubleshooting

- **Blank screen after changing config**: stop the server and run `npx expo start --web -c` to clear the Metro cache.
- **"AI coach is not connected"**: no `ANTHROPIC_API_KEY` on the server. See above.
- **Progress disappeared**: progress is stored in the browser (or on the device). Clearing site data, or using a different browser or a private window, starts fresh.
