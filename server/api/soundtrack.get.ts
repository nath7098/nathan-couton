import { CONFIG_ERRORS, LastfmError, fetchTopListening, type Listening } from '../utils/lastfm'

/**
 * What Nathan has been listening to this month: his Apple Music plays,
 * scrobbled to Last.fm.
 *
 * Called at prerender time (so the HTML carries the list as of the deploy)
 * and again by the browser once the profile is in view (so it stays current
 * between deploys). Vercel's CDN keeps each answer for an hour: Last.fm is
 * asked at most a few times an hour, however many people visit.
 *
 * It never fails. Unconfigured, misconfigured or with nothing scrobbled yet,
 * it answers `{ live: false }` and the page shows the frozen 2024 soundtrack.
 */
export type Soundtrack = ({ live: true } & Listening) | { live: false }

/** Same answer for every visitor: a warm instance need not ask Last.fm twice. */
const MEMO_MS = 10 * 60 * 1000
let memo: { value: Soundtrack, at: number } | undefined

async function load(): Promise<Soundtrack> {
  const { apiKey, user } = useRuntimeConfig().lastfm

  if (!apiKey || !user) return { live: false }

  try {
    const listening = await fetchTopListening({ apiKey, user }, { period: '1month' })
    return listening.tracks.length > 0 ? { live: true, ...listening } : { live: false }
  }
  catch (error) {
    // A wrong key or user name is ours to fix: say which variable, plainly,
    // where the owner will look.
    const culprit = error instanceof LastfmError && error.code ? CONFIG_ERRORS[error.code] : undefined
    console.error(`[soundtrack] ${error instanceof Error ? error.message : error}${culprit ? ` — check ${culprit}.` : ''}`)
    return { live: false }
  }
}

export default defineEventHandler(async (event): Promise<Soundtrack> => {
  const now = Date.now()
  if (!memo || now - memo.at > MEMO_MS) memo = { value: await load(), at: now }

  // A fallback is cached briefly, so a fixed configuration shows up quickly.
  event.node.res.setHeader('cache-control', memo.value.live
    ? 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    : 'public, max-age=60, s-maxage=600')

  return memo.value
})
