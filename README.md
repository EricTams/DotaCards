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
