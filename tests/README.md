# Tests

`check.py` is the release check used by the `koi-release` skill.

```
pip install playwright
python3 -m playwright install chromium
python3 tests/check.py                 # tests source/public/index.html
python3 tests/check.py index.html      # tests the built file at the repo root
```

It passes when the game starts with no errors and a steering bot makes a first sale on desktop and phone. Screenshots land in `tests/out/` (git-ignored).

Testing the built root file sends events to PostHog under `host = local`, which the PostHog test filter should exclude. Prefer testing the source file.

`?debug=analytics` (or any `?debug=`) exposes `window.__koi` for bots: `lead`, `foods`, `school`, `turtles`, `herons`, `pier`, `runTime`, `coachStep`, plus helpers such as `addKoi(rare)`, `startBoss()`, `spawnSnake()`, `setPond(id)`, `harvest()` and `pause()`.
