# Analytics Setup and Funnel Guide (7-day pilot)

Pick **one** provider for the pilot.

- **PostHog** is the better fit. It can filter funnel steps by property, it has true 7-day retention cohorts, and you get 1M events a month on the free plan.
- **Umami Cloud** is simpler and cookieless. The free Hobby plan allows 100K events a month, and Umami counts every stored property as an event, so the game sends at most 3 properties per event to Umami.

## 1. Event schema (build `pilot-1`)

Every event carries these context properties: `device` (mobile/desktop), `mode` (arcade/zen), `returning` (true/false), `day_bucket` (d0, d1, d2-3, d4-7, d8+ since first visit), `session_bucket` (1, 2, 3-5, 6+), and `build`.

| Event | When it fires | Key properties | Sent to Umami |
|---|---|---|---|
| `game_start` | Once per page load, on **Start Swimming** | `ref` (whatsapp, linkedin, discord, twitter, search, direct, other), `first_run`, `orientation` | device, returning, ref |
| `ob_first_move` | First steering input (first run only) | none | device |
| `ob_first_food` | First pellet eaten (first run only) | none | device |
| `ob_first_koi` | First koi joins the school (first run only) | none | device |
| `ob_first_hazard` | First turtle or heron shown with a warning label | none | device |
| `ob_sell_prompt` | Coach points to the pier (3 koi, or fewer after a timeout) | none | device |
| `first_harvest` | First sale ever (lifetime, once per device) | `ttfh_sec`, `ttfh_bucket` (<30s, 30-45s, 45-75s, 75-120s, 120s+), `school_size`, `school_bucket`, `yen` | ttfh_bucket, device, school_bucket |
| `harvest` | Every sale (max 30 per session) | `school_size`, `school_bucket`, `yen`, `order_done`, `order_tier` | school_bucket, order_done, device |
| `enemy_hit` | Player or school is hit (max 25 per session) | `hazard` (turtle/heron), `target` (lead/school), `koi_lost`, `school_bucket` | hazard, school_bucket, koi_lost |
| `shop_upgrade` | Breed unlock or upgrade bought | `category`, `item`, `level`, `cost` | item, level |
| `session_ping` | Each 60 s of visible play (max 15 per session) | `minute`, `school_bucket` | minute, device |

**Budget check.** A typical 5-minute first session sends about 25 events. On Umami, with properties counted, that is roughly 90 billable events, so 100K a month covers about 1,000 to 1,100 sessions. If the pilot grows past that, set `umamiMaxProps: 2` in `public/index.html` or switch to PostHog. On PostHog, 1M events covers about 40,000 sessions.

**Verify before sharing.** Open `https://<your-site>/?debug=analytics`, play for a minute, and check that events print in the browser console. Then confirm they appear in the provider's live or activity view.

## 2A. PostHog setup

1. Sign up at posthog.com (US or EU cloud), create a project, and copy the **Project API key** (`phc_...`).
2. Deploy: `ANALYTICS_PROVIDER=posthog POSTHOG_KEY=phc_... npm run deploy`. For the EU cloud, also set `POSTHOG_HOST=https://eu.i.posthog.com`.
3. Create a dashboard called **Koi Pilot** and add these insights:

| # | Insight | Configuration |
|---|---|---|
| 1 | **Onboarding funnel** | Funnel: `game_start` (filter `first_run = true`) → `ob_first_food` → `ob_first_koi` → `ob_sell_prompt` → `first_harvest`. Conversion window 30 minutes. Breakdown by `device`. |
| 2 | **Time to first harvest** | Trends: `first_harvest`, total count, breakdown by `ttfh_bucket`, shown as a bar chart. Add a second series: `first_harvest`, property value **median** of `ttfh_sec`. |
| 3 | **D1 / D7 retention** | Retention: cohortizing event `game_start` (first time), returning event `game_start`, Day intervals, 7 periods. |
| 4 | **Session depth** | Trends: `session_ping`, unique users, breakdown by `minute`. Shows how many players reach 1, 3 and 5 minutes. |
| 5 | **Difficulty heat** | Trends: `enemy_hit`, total count, breakdown by `hazard`, with a second breakdown by `school_bucket`. Add the formula A/B where B is `harvest` count, to get hits per harvest. |
| 6 | **Risk appetite** | Trends: `harvest`, breakdown by `school_bucket`. Over the week, the share of 4-6 and 7+ should grow. |
| 7 | **Order engagement** | Trends: `harvest`, breakdown by `order_done`. |
| 8 | **Economy** | Trends: `shop_upgrade`, breakdown by `item`. Second funnel: `first_harvest` → `shop_upgrade`. |
| 9 | **Acquisition** | Trends: `game_start` unique users, breakdown by `ref`. Funnel #1 again, broken down by `ref`. |
| 10 | **Platform split** | Trends: `game_start` unique users, breakdown by `device`. |

## 2B. Umami Cloud setup

1. Sign up at cloud.umami.is, choose **Add website**, enter the pages.dev domain, and copy the **Website ID**.
2. Deploy: `ANALYTICS_PROVIDER=umami UMAMI_WEBSITE_ID=... npm run deploy`.
3. Under **Reports**, create:

| Report | Configuration |
|---|---|
| **Funnel: onboarding** | Steps (type Event): `game_start` → `ob_first_food` → `ob_first_koi` → `ob_sell_prompt` → `first_harvest`. Window 30 minutes. Umami funnels cannot filter by property, so returning players also enter step 1 here. Read the step 1 → 2 rate as approximate and trust steps 2 → 5. |
| **Retention** | Date range: the pilot week. Umami's cookieless visitor ID resets monthly and differs per browser, so treat this as directional. Cross-check with the `returning` and `day_bucket` properties on `game_start` (Events tab, open the event, view property breakdown). |
| **Events tab** | Open `first_harvest` and read the `ttfh_bucket` breakdown. Open `enemy_hit` and read `hazard` and `school_bucket`. Open `harvest` and read `school_bucket` and `order_done`. Open `game_start` and read `ref` and `returning`. |
| **Goals** (optional) | Goal: `first_harvest` event. Goal: `session_ping` event, to measure "played at least 1 minute". |

## 3. Pilot scorecard

| Metric | Where to read it | Healthy | Act if |
|---|---|---|---|
| Start rate (`game_start` / pageviews) | Pageviews vs `game_start` | > 70% | < 50%: the welcome card or load time is losing people |
| First food rate (`ob_first_food` / first-run `game_start`) | Funnel #1 step 2 | > 90% | < 80%: steering is unclear, especially on mobile |
| **First harvest rate** | Funnel #1 last step | > 55% | < 40%: the sell step is unclear or hazards arrive too early |
| Median time to first harvest | Insight #2 | 45 to 75 s | < 30 s: too easy, raise `growthNeeded`. > 100 s: lower it or add pellets |
| Played at least 3 minutes | Insight #4, minute ≥ 3 / starts | > 30% | < 15%: the loop after the first harvest lacks pull |
| Second harvest rate | Users with 2+ `harvest` / `first_harvest` users | > 60% | Low: the payout feels weak, raise yen per koi |
| Hits per harvest | Insight #5 | 1 to 3 | > 5 on mobile only: widen telegraphs or reduce turtle count on small screens |
| D1 retention | Insight #3 | > 15% | < 8%: needs a reason to return (daily order, streak) |
| D7 retention | Insight #3 | > 5% | Directional only for a 7-day pilot |
| Mobile vs desktop gap | Funnel #1 by `device` | < 10 points | > 15 points: look at joystick and dash ergonomics first |

## 4. Daily pilot routine (5 minutes)

- **Day 1:** confirm that events arrive for both `device` values and that `ref` tags are populated.
- **Days 2 to 3:** read Funnel #1 and the `ttfh_bucket` distribution. Change tuning only if a step is below the "Act if" line. Bump `BUILD` in `index.html` (for example to `pilot-2`) before redeploying, so every insight can be compared by `build`.
- **Days 4 to 6:** watch the Risk appetite insight (#6) and the Hits per harvest insight (#5). Growing school sizes with stable hits per harvest means the tension curve works.
- **Day 7:** export the dashboard, then compare D1 retention and first harvest rate by `ref` and by `device`.
