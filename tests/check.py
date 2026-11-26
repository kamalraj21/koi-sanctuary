"""Release check for Koi Sanctuary.

Run from the repo root:  python3 tests/check.py [path-to-html]
Default path: source/public/index.html (analytics off, so nothing reaches PostHog).

Checks, on desktop (1280x760) and iPhone 13 emulation:
  1. The page loads and the game starts with no JavaScript errors.
  2. A bot that steers to food and then to the pier makes a first sale.
     Expect roughly 10 to 25 s of game time for this perfect bot.
Screenshots go to tests/out/.
Needs: pip install playwright && python3 -m playwright install chromium
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "source" / "public" / "index.html"
OUT = ROOT / "tests" / "out"
OUT.mkdir(parents=True, exist_ok=True)
URL = HTML.as_uri() + "?debug=analytics"

STATE_JS = """() => {
  const k = window.__koi, L = k.lead;
  let t = null, bd = 1e9;
  for (const f of k.foods) { const d = Math.hypot(f.x - L.x, f.y - L.y); if (d < bd) { bd = d; t = f; } }
  return { rt: k.runTime, s: k.school.length, step: k.coachStep,
           t: t && [t.x, t.y], px: k.pier.basketX, py: k.pier.basketY };
}"""

failures = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, opts in [("desktop", {"viewport": {"width": 1280, "height": 760}}),
                       ("mobile", p.devices["iPhone 13"])]:
        ctx = browser.new_context(**opts)
        page = ctx.new_page()
        logs, errors = [], []
        page.on("console", lambda m: logs.append(m.text))
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_timeout(500)
        page.evaluate("document.getElementById('btn-enter-pond').click()")
        page.wait_for_timeout(300)
        first_sale = None
        for _ in range(1600):
            st = page.evaluate(STATE_JS)
            if st["step"] == "sell" and st["s"] > 0:
                tx, ty = st["px"], st["py"]
            elif st["t"]:
                tx, ty = st["t"]
            else:
                tx, ty = 300, 400
            page.mouse.move(tx, max(60, ty))
            page.wait_for_timeout(80)
            if any("first_harvest" in line for line in logs):
                first_sale = round(st["rt"], 1)
                break
        page.screenshot(path=str(OUT / f"{name}.png"))
        build = next((line.split('"build":"')[1].split('"')[0] for line in logs if '"build":"' in line), "?")
        print(f"{name}: build={build} first_sale_s={first_sale} errors={len(errors)}")
        if errors:
            failures.append(f"{name}: {errors[:3]}")
        if first_sale is None:
            failures.append(f"{name}: bot never made a first sale")
        ctx.close()
    browser.close()

if failures:
    print("FAIL")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("PASS")
