/**
 * Exercises POST /api/contact against the built serverless bundle, over real
 * HTTP — the artefact that actually ships, not the source.
 *
 * EmailJS is deliberately left unconfigured: a valid message then stops at 503
 * instead of sending, so the run never posts anything, while validation, the
 * spam traps and the rate limit are all still exercised.
 *
 * Requires `npm run build` first.
 */
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Resolved against the repo root, not the caller's cwd.
const BUNDLE = fileURLToPath(new URL('../.vercel/output/functions/api/contact.func/index.mjs', import.meta.url))
if (!existsSync(BUNDLE)) {
  console.error(`✗ ${BUNDLE} missing — run \`npm run build\` first.`)
  process.exit(1)
}

let failures = 0
const expect = (actual, wanted, label) => {
  const ok = actual === wanted
  if (!ok) failures++
  console.log(`  ${ok ? '✓' : '✗'} ${label} → ${actual}${ok ? '' : ` (expected ${wanted})`}`)
}
const mod = await import(BUNDLE)
const handler = mod.default ?? mod.handler

const server = createServer((req, res) => handler(req, res))
await new Promise(r => server.listen(4180, r))

const post = async (body, headers = {}) => {
  const res = await fetch('http://localhost:4180/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9', ...headers },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.text(), remaining: res.headers.get('x-ratelimit-remaining') }
}

const valid = {
  name: 'Nathan', email: 'nathan@example.com',
  message: 'Bonjour, ceci est un message de test suffisamment long.', elapsed: 9000,
}

console.log('validation')
expect((await post({})).status, 422, 'empty body')
expect((await post({ ...valid, email: 'not-an-email' })).status, 422, 'malformed email')
expect((await post({ ...valid, message: 'short' })).status, 422, 'message too short')

// Spam traps answer 200 without sending: telling a bot why it failed helps it.
console.log('spam traps (200, nothing sent)')
expect((await post({ ...valid, company: 'Acme Corp' }, { 'x-forwarded-for': '203.0.113.10' })).status, 200, 'honeypot filled')
expect((await post({ ...valid, elapsed: 120 }, { 'x-forwarded-for': '203.0.113.11' })).status, 200, 'submitted too fast')

console.log('unconfigured mail service')
expect((await post(valid, { 'x-forwarded-for': '203.0.113.12' })).status, 503, 'valid message, no credentials')

console.log('rate limit (5 per hour per IP)')
const ip = { 'x-forwarded-for': '198.51.100.7' }
for (let i = 1; i <= 6; i++) {
  const response = await post(valid, ip)
  expect(response.status, i <= 5 ? 503 : 429, `request ${i} (remaining ${response.remaining})`)
}

server.close()

if (failures) {
  console.error(`\n✗ ${failures} API check(s) failed.`)
  process.exit(1)
}
console.log('\n✓ contact API passed')
