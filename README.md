# QEDify

Learn momentum, impulse and collisions through space-rescue missions. A cross-platform app (web first) built with Expo and React Native.

- **17 missions in 4 chapters**: momentum fundamentals, impulse and force, conservation laws, collision mastery (with a boss mission).
- **A physics engine that generates every problem** from a seed, so replays use new numbers and the daily challenge is the same for everyone.
- **Misconception-aware feedback**: wrong answers are matched against 17 known error patterns (vector neglect, force vs impulse, wrong denominator, ...).
- **Adaptive support**: a per-skill mastery model sets the support tier (guided, standard, expert). Hints, visible vectors, the scaffold card and the clock all change with it.
- **AI coach powered by Claude**: personalised hints, mission debriefs and learning insights, with built-in rule-based feedback whenever the coach is off or unreachable.
- **Wrong answers play out**: the feedback dialog simulates what the learner's own answer would do (a ship still moving on contact, a net that tears, momentum that appears from nowhere) without giving the right answer away.
- **Drag-and-drop vectors**: any answer that is a vector (momentum, impulse, force, velocity) can be set by dragging an arrow; in the lab the velocity arrows in the scene are draggable.
- **Thai and English**: the whole app, every mission and the AI coach. `/th` is a Thai landing page.
- **Stall prompts and retention checks**: a concept-level prompt appears when the learner stops answering, and cleared missions come back days later with new numbers and no support.
- **Research tools**: a built-in satisfaction survey for students and teachers, export of every logged answer as JSON or CSV, and a script that aggregates the exports.
- **Works offline**: after the first visit a service worker serves every page from the device.
- **Accessible**: every control works from the keyboard (sliders and vector inputs included), dialogs hold focus, selected states and values are exposed to screen readers, and Settings can turn off the mission clock and decorative motion. Shared helpers live in `lib/a11y.tsx`.
- **Virtual lab**: set mass and velocity freely and run elastic or inelastic collisions.
- **Learning analytics**: accuracy, decision time, hint use, solving style, skill mastery, badges, streaks.
- **Responsive on every screen**: bottom tabs on phones, a side rail on tablets, labelled navigation and two-column screens on desktops.
- **Hand-drawn SVG graphics**: every icon and illustration is vector art in `components/`, so there are no bitmap or icon-font downloads.
- **Search-engine ready**: the public pages are pre-rendered to HTML with titles, descriptions, Open Graph cards, structured data, a sitemap and a web app manifest.

See [SETUP.md](SETUP.md) to run it and [docs/paper-alignment.md](docs/paper-alignment.md) for how the app maps onto the research paper.

## How it fits together

```
app/                 Screens (Expo Router). (game)/ needs a cadet profile.
  (game)/mission/    The mission runner: one screen plays every mission
components/          SVG icons and illustrations, simulation scene, navigation, slider
lib/engine/          Pure TypeScript: problem generators, answer checker, misconceptions
lib/engine/consequence.ts  What a wrong answer would physically do
lib/progress.ts      Pure functions: scoring, mastery, tiers, badges, analytics, retention
lib/i18n.tsx         Language hook: L("English", "ไทย")
lib/export.ts        Research data export (JSON, CSV)
lib/store.tsx        Learner state, saved on the device (AsyncStorage)
lib/ai.ts            Client for the coach endpoint
server/coach.js      The only code that calls the Claude API
api/coach.js         Vercel function wrapping server/coach.js
metro.config.js      Serves /api/coach during `expo start`
public/              robots.txt, sitemap.xml, manifest, favicon, social image
app/+html.tsx        HTML shell for the pre-rendered pages
scripts/             Physics verifier (npm run verify)
```

The client never sends a prompt or the player's name to the coach. It sends a task name (`hint`, `debrief`, `insights`) and structured mission data; the prompt is assembled on the server, where the API key lives.

## Checks

| Command | What it does |
| --- | --- |
| `npm run verify` | Generates 20,400 mission instances and checks every answer against conservation laws, simulates 15,480 wrong answers, and checks that every Thai string is translated |
| `npm run aggregate -- <folder>` | Combines exported learner files into `participants.csv`, `likert.csv` and `misconceptions.csv` |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint (Expo config) |
| `npm run build:web` | Pre-renders every page to static HTML in `dist/` |
| `node scripts/serve-dist.js` | Serves `dist/` locally with the same URL rules as production |

Measured on the production build of both landing pages, `/` and `/th` (Lighthouse, mobile): Accessibility 100, Best Practices 100, SEO 100. An earlier build, before the Thai translation was added, reached a largest contentful paint of 0.7 s under Slow 4G with a 4× CPU slowdown; that trace has not been repeated on the current build. The JavaScript bundle is about 650 kB gzipped.
