# Koi Sanctuary

**Play:** https://kamalraj21.github.io/koi-sanctuary/

Hosted on GitHub Pages from the root of this repo. The root `index.html` is the built game with the site URL and PostHog analytics stamped in. The editable source and the Cloudflare deploy scripts live in `source/`.

## Updating the live game

1. Edit `source/public/index.html`.
2. Rebuild from `source/`:
   `SITE_URL=https://kamalraj21.github.io/koi-sanctuary ANALYTICS_PROVIDER=posthog POSTHOG_KEY=phc_... node scripts/build.mjs`
3. Copy `source/dist/index.html` to the repo root, then commit and push.

---


A one-minute ink-wash pond game. Eat, grow a living school of koi, slip past snapping turtles and heron strikes, then cash out at the lantern pier. One self-contained HTML file with no dependencies. Runs on phone and desktop.

## Repository layout

```
source/public/       Editable game source (Cloudflare build input)
  index.html         The whole game (HTML, CSS, JS)
  og-preview.png     1200x630 share card for WhatsApp, LinkedIn, Discord, X
  _headers           Cloudflare Pages cache and security headers
scripts/
  build.mjs          Copies public/ to dist/ and stamps SITE_URL + analytics keys
  deploy.mjs         Login check, build, create project, upload (npm run deploy)
tools/og-poster.html Source for og-preview.png
.github/workflows/   Optional push-to-deploy via GitHub Actions
ANALYTICS.md         Event schema, dashboards, funnels and the pilot plan
.env.example         Deploy-time settings template
```

## Play locally

Open `public/index.html` in a browser. Or serve it so phones on your Wi-Fi can join:

```bash
npm run preview          # http://localhost:4173
```

Add `?debug=analytics` to the URL to log every analytics event to the browser console.

## Deploy to Cloudflare Pages (one command)

Requires Node 18 or newer and a free Cloudflare account.

```bash
npm run deploy
```

The first run opens your browser once to approve the Cloudflare login. The script then builds `dist/`, creates the `koi-sanctuary` Pages project, and uploads it. The game goes live at `https://koi-sanctuary.pages.dev`.

If Cloudflare gives you a different subdomain (the name was taken) or you add a custom domain, set `SITE_URL` and deploy again so the share cards point to the right image:

```bash
SITE_URL=https://your-subdomain.pages.dev npm run deploy
```

To use a different project name, set `PAGES_PROJECT=my-name`.

### Turn on analytics

Copy `.env.example` to `.env`, pick a provider, and deploy again:

```env
ANALYTICS_PROVIDER=umami
UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

or

```env
ANALYTICS_PROVIDER=posthog
POSTHOG_KEY=phc_xxxxxxxxxxxxxxxx
POSTHOG_HOST=https://us.i.posthog.com
```

The keys are stamped into `dist/index.html` at build time. `public/index.html` keeps `provider: 'none'`, so local play never sends events. See `ANALYTICS.md` for what to configure on the dashboard side.

### Optional: deploy on every push (GitHub)

1. Create a GitHub repository and push this folder to `main`.
2. In Cloudflare, create an API token from the **Edit Cloudflare Pages** template. Copy your Account ID from the dashboard sidebar.
3. In the GitHub repository, open **Settings > Secrets and variables > Actions**. Add the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Optionally add the variables `SITE_URL`, `ANALYTICS_PROVIDER`, `UMAMI_WEBSITE_ID`, `POSTHOG_KEY`, and `POSTHOG_HOST`.
4. Push. `.github/workflows/deploy.yml` builds and deploys.

## Sharing the pilot link

Tag each channel so analytics can attribute players:

| Channel  | Link                                         |
|----------|----------------------------------------------|
| WhatsApp | `https://koi-sanctuary.pages.dev/?ref=wa`    |
| LinkedIn | `https://koi-sanctuary.pages.dev/?ref=li`    |
| Discord  | `https://koi-sanctuary.pages.dev/?ref=dc`    |

WhatsApp and many in-app browsers strip the referrer, so untagged links show up as `direct`.

After the first deploy, check the share card in the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and refresh it there if needed. WhatsApp and Discord cache previews per URL. If you replace the image later, share a new variant such as `?ref=wa2`.

## Regenerating the share image

Open `tools/og-poster.html` in Chrome, right-click the image, choose **Save image as**, and save it over `public/og-preview.png`. Keep the file under 300 KB so WhatsApp shows the large preview.

## Design notes for this build (`pilot-1`)

- **First run:** in-world coach cues guide new players through three steps (swim into food, grow the school, swim to the pier). A curved trail of pellets in front of the koi teaches steering. Hazards stay away until the player has a reason to care: turtles arrive after about 16 s or the first koi, herons after about 24 s with two or more koi. The first heron and turtle get longer telegraphs and a one-time "Red = danger" label.
- **Pacing:** about 15 pellets build a 3-koi school. A scripted bot that plays perfectly reaches its first harvest in 10 to 23 s of game time, which should put a new human at roughly 45 to 75 s. Use the `ttfh_bucket` property in the pilot to confirm it.
- **Risk and reward:** harvest value scales with school size. Market orders are generated from the breeds you can actually field, so no order is ever impossible. Each completed order asks for a bigger school and pays a bigger bonus. Heron frequency and telegraph speed scale with school size. Turtles only cost you during a telegraphed wind-up or lunge, so brushing a patrolling turtle is just a bump.
- **Ergonomics:** the floating joystick base follows your thumb past its rim. Input mode follows the pointer you actually use, so touchscreen laptops still steer with the mouse. Audio unlocks on the first touch, click, or key on iOS Safari and Android Chrome, recovers after phone calls, and uses the iOS "ambient" session so it respects the silent switch. Screen shake is capped, scales down as it decays, and is skipped when the OS has Reduce Motion on. Brief hit-stop marks real hits only.
- **Performance and resilience:** saves are batched and flushed when the tab hides. Resize is debounced. A `roundRect` polyfill covers Safari before 16. Storage falls back to memory inside sandboxed iframes.
