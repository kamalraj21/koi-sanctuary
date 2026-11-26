# Koi Sanctuary: project brief

Start every new chat about this project by reading this file. Keep it under one screen; update it after each release or decision.

## What this is

A one-minute ink-wash koi pond game (single HTML5 file), published on GitHub Pages and itch.io.

## Where everything lives

| Thing | Location |
| --- | --- |
| Live game | https://kamalraj21.github.io/koi-sanctuary/ (GitHub Pages, repo root `index.html`) |
| itch.io page | https://funfunda.itch.io/koi-sanctuary (zips uploaded by hand) |
| Editable source | `source/public/index.html` |
| Build script | `source/scripts/build.mjs` (stamps site URL + PostHog key into `dist/`) |
| Tests | `tests/` (Playwright, see `tests/README.md`) |
| Store and share assets | `marketing/` (itch cover, screenshots, share image source) |
| Plan, rules, roadmap | Operating Plan doc: https://claude.ai/artifact/CSYQbWVo5CZeNwuF7KTHi2 |
| Analytics | PostHog US cloud, dashboard "Koi Pilot". Events: `ANALYTICS.md` |
| History | `CHANGELOG.md` (what shipped), `DECISIONS.md` (why) |

## Current state

- Live build: **pilot-10** (both GitHub and itch.io).
- Status: **feature freeze** until the pilot review on Sun 29 Nov 2026.
- Pilot so far: 35 first-time players; 71 to 75% reach a first sale on current builds; 52% still playing at minute 3; Day 1 return not yet readable.

## Rules (from the Operating Plan)

- One thing in progress. New ideas go to the plan's Backlog with a gate.
- Every change states the number it should move.
- The owner decides and publishes; Claude builds, tests and drafts.
- Share gate before any wide share: tested on phone and iPad, PostHog shows the new build, tagged `?ref=` links, small circle first.

## Skills to use

- `koi-release`: build, test, push, itch.io zip.
- `koi-weekly-review`: PostHog results into the three numbers and at most two actions.
- `koi-devlog`: drafts for itch.io devlogs and posts.

Private goals, constraints and working notes live in the Operating Plan doc, not in this public repo.
