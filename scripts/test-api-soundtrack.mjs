/**
 * GET /api/soundtrack with Apple Music configured, against a stand-in for
 * Apple's API. Run by scripts/test-api.mjs, one process per scenario, because
 * the bundle reads its runtime config once, when it loads:
 *
 *   live     two pages of history → ranked tracks and artists, cached an hour
 *   expired  Apple answers 401 → the 2024 fallback, and a log saying how to fix it
 */
import { createServer } from 'node:http'
import { generateKeyPairSync, verify } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const BUNDLE = fileURLToPath(new URL('../.vercel/output/functions/api/soundtrack.func/index.mjs', import.meta.url))
const scenario = process.argv[2]

let failures = 0
const expect = (actual, wanted, label) => {
  const ok = actual === wanted
  if (!ok) failures++
  console.log(`  ${ok ? '✓' : '✗'} ${label} → ${actual}${ok ? '' : ` (expected ${wanted})`}`)
}

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
process.env.NUXT_APPLE_MUSIC_TEAM_ID = 'TEAM123'
process.env.NUXT_APPLE_MUSIC_KEY_ID = 'KEY456'
// As pasted into a single-line env var.
process.env.NUXT_APPLE_MUSIC_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().trim().replace(/\n/g, '\\n')
process.env.NUXT_APPLE_MUSIC_USER_TOKEN = 'user-token'

const song = (name, artistName, id) => ({
  id, type: 'songs', attributes: { name, artistName, url: `https://music.apple.com/fr/song/${id}` },
})
const PAGE_ONE = [
  song('Rain', 'Sleep Token', '1'), song('Like A Villain', 'Bad Omens', '2'), song('Rain', 'Sleep Token', '1'),
  ...Array.from({ length: 27 }, (_, i) => song(`Filler ${i}`, 'Periphery', String(100 + i))),
]
const PAGE_TWO = Array.from({ length: 20 }, (_, i) => song(`Older ${i}`, 'Bad Omens', String(200 + i)))

const calls = []
const realFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = String(input)
  if (!url.startsWith('https://api.music.apple.com/')) return realFetch(input, init)
  calls.push({ url, headers: new Headers(init?.headers) })
  if (scenario === 'expired') return new Response('{"errors":[]}', { status: 401 })
  const second = url.includes('offset=30')
  return Response.json({
    data: second ? PAGE_TWO : PAGE_ONE,
    ...(second ? {} : { next: '/v1/me/recent/played/tracks?types=songs,library-songs&offset=30' }),
  })
}

const logged = []
const realError = console.error
console.error = (...args) => logged.push(args.join(' '))

const handler = (await import(BUNDLE)).default
const server = createServer((req, res) => handler(req, res))
await new Promise(r => server.listen(4181, r))

const res = await realFetch('http://localhost:4181/api/soundtrack')
const body = await res.json()
expect(res.status, 200, 'answers')

if (scenario === 'live') {
  expect(body.live, true, 'is live')
  expect(body.tracks.map(t => t.title).join(' | '), 'Rain | Like A Villain | Filler 0 | Filler 1', 'tracks by plays, then recency')
  expect(body.artists.join(', '), 'Periphery, Bad Omens, Sleep Token', 'artists by plays')
  expect(body.tracks[0].href, 'https://music.apple.com/fr/song/1', 'links to Apple Music')
  expect(calls.length, 2, 'reads both pages of the history')
  expect(res.headers.get('cache-control'), 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400', 'cached an hour on the CDN')

  const auth = calls[0].headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  const [h, p, s] = auth.split('.')
  const signed = s && verify('sha256', Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))
  expect(signed, true, 'developer token is signed with the MusicKit key')
  expect(JSON.parse(Buffer.from(h, 'base64url').toString()).kid, 'KEY456', 'and names its key')
  expect(calls[0].headers.get('music-user-token'), 'user-token', 'user token is sent')

  await realFetch('http://localhost:4181/api/soundtrack')
  expect(calls.length, 2, 'a warm instance does not ask Apple again')
}
else {
  expect(JSON.stringify(body), '{"live":false}', 'falls back')
  expect(logged.some(line => line.includes('401') && line.includes('apple-music:token')), true, 'logs how to renew the token')
}

server.close()
console.error = realError
process.exit(failures ? 1 : 0)
