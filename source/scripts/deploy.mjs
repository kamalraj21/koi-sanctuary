// One-command Cloudflare Pages deploy: `npm run deploy`
// 1. Logs in to Cloudflare if needed (opens your browser once).
// 2. Builds dist/ with your SITE_URL and analytics settings.
// 3. Creates the Pages project on first run, then uploads dist/.
// Works on macOS, Linux and Windows (Node 18+).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = process.env.PAGES_PROJECT || 'koi-sanctuary';
const WRANGLER = ['--yes', 'wrangler@4'];

function run(args, { capture = false, allowFail = false } = {}) {
  const res = spawnSync('npx', [...WRANGLER, ...args], {
    cwd: root,
    stdio: capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
  if (res.status !== 0 && !allowFail) {
    console.error(`\nwrangler ${args.join(' ')} failed.`);
    process.exit(res.status || 1);
  }
  return `${res.stdout || ''}${res.stderr || ''}`;
}

console.log('Checking Cloudflare login...');
const who = run(['whoami'], { capture: true, allowFail: true });
if (/not authenticated/i.test(who) || !/associated with the email|Account Name|Account ID/i.test(who)) {
  console.log('Opening the Cloudflare login page in your browser. Approve it, then come back here.');
  run(['login']);
}

const build = spawnSync(process.execPath, [join(root, 'scripts', 'build.mjs')], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);

const list = run(['pages', 'project', 'list'], { capture: true, allowFail: true });
if (!new RegExp(`\\b${PROJECT}\\b`).test(list)) {
  console.log(`Creating Pages project "${PROJECT}"...`);
  run(['pages', 'project', 'create', PROJECT, '--production-branch=main'], { allowFail: true });
}

console.log(`Deploying dist/ to ${PROJECT}...`);
const out = run(['pages', 'deploy', 'dist', `--project-name=${PROJECT}`, '--branch=main', '--commit-dirty=true'], { capture: true });
process.stdout.write(out);

const url = (out.match(/https:\/\/[^\s]+\.pages\.dev/) || [])[0];
console.log('\nDone.');
if (url) console.log(`Deployment URL: ${url}`);
console.log(`Production URL: https://${PROJECT}.pages.dev  (if Cloudflare assigned a different subdomain, rerun with SITE_URL set to it so share cards point to the right image)`);
