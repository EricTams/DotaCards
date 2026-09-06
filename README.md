# Ancient Path — first playable

A browser prototype of a three-hero exploration deckbuilder.

## Run locally

`npm install`, then `npm run dev`. The server prints its local URL.

## Edit the design

- `lib/game.mjs`: hero stats and growth, cards, aspects, relics, consumables, map, and deterministic rules.
- `app/page.tsx`: hero selection, portrait sidebar, large map, combat, rewards, help, and feedback.
- `app/globals.css`: visual theme and responsive layout.
- Design discussion documents live in `../docs` in the local workspace.

## Verify

- `node --test tests/game.test.mjs`
- `node tests/playthrough.mjs`
- `npx tsc --noEmit`
- `npm run build`

Automated playthroughs exercise complete legal runs using revealed map information. They establish a winning route for each hero; they do not establish human difficulty or run duration.

## Current limitations

One authored map and a fixed shuffle seed (1729). No save/resume: refresh starts over. This is an intentionally small content set; enemy variety, tuning, and the 45–60-minute target still need human playtesting. The portrait art is loaded from Valve’s official Dota CDN. No broad browser visual QA has been performed.

The optional WebMCP tools expose only revealed game information and the same validated actions as the UI. Registration, valid start/move/read calls, and invalid hero/movement rejection were checked in the local browser context.

## GitHub Pages

GitHub Pages is the selected publishing target. The `main` branch workflow tests and statically exports the game, then publishes `out/`. `PAGES_BASE_PATH=/DotaCards` enables static export and supplies the project asset prefix. `node scripts/prepare-pages.mjs` stages the static output in `out/` and verifies its asset URLs. Local `npm run dev` stays at `/`.

The `.openai/hosting.json` registration belongs to an unused, unpublished Sites draft; it is not used by the GitHub Pages build. No Sites source upload or deployment occurred.

## Simple AI

Step advances one bot action; Play runs an action every 650 ms; Pause or any manual gameplay action hands control back. Opening a detail panel pauses it. It stops on win, loss, no useful route, or 1,500 actions.

`lib/bot.mjs` receives a redacted observation with revealed terrain and the visible hand. It uses its own seeded RNG, picks random affordable cards without evaluating combinations or enemy intent, takes random rewards, and follows a few route/resource thresholds. It does not simulate future turns or inspect the draw pile.

`node tests/bot-runs.mjs` runs 20 seeds per hero without the UI. This deliberately weak bot is a baseline for finding broken rules and comparing future policies, not evidence of balanced human difficulty. The older `tests/playthrough.mjs` is a separate, stronger bounded-search test controller.
