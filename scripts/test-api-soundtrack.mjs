/**
 * GET /api/soundtrack with Last.fm configured, against a stand-in for
 * Last.fm's API. Run by scripts/test-api.mjs, one process per scenario,
 * because the bundle reads its runtime config once, when it loads:
 *
 *   live     top tracks and artists over a month, cached an hour
 *   invalid  Last.fm rejects the key → the 2024 fallback, and a log naming the variable
 */
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'

const BUNDLE = fileURLToPath(new URL('../.vercel/output/functions/api/soundtrack.func/index.mjs', import.meta.url))
const scenario = process.argv[2]

let failures = 0
const expect = (actual, wanted, label) => {
  const ok = actual === wanted
  if (!ok) failures++
  console.log(`  ${ok ? '✓' : '✗'} ${label} → ${actual}${ok ? '' : ` (expected ${wanted})`}`)
}

process.env.NUXT_LASTFM_API_KEY = 'test-key'
process.env.NUXT_LASTFM_USER = 'nath7098'

const track = (name, artist) => ({
  name, playcount: '12', artist: { name: artist }, url: `https://www.last.fm/music/${encodeURIComponent(artist)}/_/${encodeURIComponent(name)}`,
})
const TOP_TRACKS = { toptracks: { track: [
  track('Emergence', 'Sleep Token'), track('Ragnarok', 'Periphery'),
  track('The Death of Peace of Mind', 'Bad Omens'), track('Granite', 'Sleep Token'),
] } }
const TOP_ARTISTS = { topartists: { artist: [{ name: 'Sleep Token' }, { name: 'Periphery' }, { name: 'Bad Omens' }, { name: 'Spiritbox' }] } }

const calls = []
const realFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input))
  if (url.hostname !== 'ws.audioscrobbler.com') return realFetch(input, init)
  calls.push(url)
  // Last.fm reports errors in the body, here with a 403.
  if (scenario === 'invalid') return Response.json({ error: 10, message: 'Invalid API key' }, { status: 403 })
  return Response.json(url.searchParams.get('method') === 'user.gettoptracks' ? TOP_TRACKS : TOP_ARTISTS)
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
  expect(body.tracks.map(t => t.title).join(' | '), 'Emergence | Ragnarok | The Death of Peace of Mind | Granite', 'tracks in Last.fm\'s order')
  expect(body.artists.join(', '), 'Sleep Token, Periphery, Bad Omens, Spiritbox', 'artists in Last.fm\'s order')
  expect(body.tracks[0].href, 'https://www.last.fm/music/Sleep%20Token/_/Emergence', 'links to the Last.fm page')
  expect(res.headers.get('cache-control'), 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400', 'cached an hour on the CDN')

  expect(calls.map(url => url.searchParams.get('method')).sort().join(', '), 'user.gettopartists, user.gettoptracks', 'asks for top tracks and top artists')
  const params = calls[0].searchParams
  expect(`${params.get('user')} ${params.get('api_key')} ${params.get('period')} ${params.get('format')}`,
    'nath7098 test-key 1month json', 'for the configured user, over a month, as JSON')

  await realFetch('http://localhost:4181/api/soundtrack')
  expect(calls.length, 2, 'a warm instance does not ask Last.fm again')
}
else {
  expect(JSON.stringify(body), '{"live":false}', 'falls back')
  expect(logged.some(line => line.includes('error 10') && line.includes('NUXT_LASTFM_API_KEY')), true, 'logs which variable to check')
}

server.close()
console.error = realError
process.exit(failures ? 1 : 0)
