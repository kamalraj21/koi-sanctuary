// Copies public/ to dist/ and stamps deploy-time settings into index.html:
//   SITE_URL            absolute site URL for Open Graph tags (default https://koi-sanctuary.pages.dev)
//   ANALYTICS_PROVIDER  none | umami | posthog | console
//   UMAMI_WEBSITE_ID    Umami Cloud website ID
//   POSTHOG_KEY         PostHog project API key (phc_...)
//   POSTHOG_HOST        https://us.i.posthog.com (default) or https://eu.i.posthog.com
// Values can also live in a .env file next to package.json.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader (no dependency).
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
  }
}

const DEFAULT_URL = 'https://koi-sanctuary.pages.dev';
const site = (process.env.SITE_URL || DEFAULT_URL).replace(/\/+$/, '');
const provider = (process.env.ANALYTICS_PROVIDER || 'none').toLowerCase();
const umamiId = process.env.UMAMI_WEBSITE_ID || '';
const phKey = process.env.POSTHOG_KEY || '';
const phHost = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

if (!['none', 'umami', 'posthog', 'console'].includes(provider)) {
  console.error(`Unknown ANALYTICS_PROVIDER "${provider}". Use none, umami, posthog or console.`);
  process.exit(1);
}
if (provider === 'umami' && !umamiId) {
  console.error('ANALYTICS_PROVIDER=umami needs UMAMI_WEBSITE_ID.');
  process.exit(1);
}
if (provider === 'posthog' && !phKey) {
  console.error('ANALYTICS_PROVIDER=posthog needs POSTHOG_KEY.');
  process.exit(1);
}

const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
cpSync(join(root, 'public'), dist, { recursive: true });

const file = join(dist, 'index.html');
let html = readFileSync(file, 'utf8');
html = html.split(DEFAULT_URL).join(site);

const js = (v) => JSON.stringify(v).replace(/"/g, "'");
const setField = (key, value) => {
  const re = new RegExp(`(\\b${key}:\\s*)'[^']*'`);
  if (!re.test(html)) throw new Error(`Could not find ${key} in ANALYTICS_CONFIG`);
  html = html.replace(re, `$1${js(value)}`);
};
setField('provider', provider);
setField('umamiWebsiteId', umamiId);
setField('posthogKey', phKey);
setField('posthogHost', phHost);

writeFileSync(file, html);
console.log(`Built dist/  site=${site}  analytics=${provider}`);
