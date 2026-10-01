import { AppleMusicError, fetchHistory, summariseHistory, type Listening } from '../utils/apple-music'

/**
 * What Nathan has been listening to lately, from Apple Music.
 *
 * Called at prerender time (so the HTML carries the list as of the deploy)
 * and again by the browser once the profile is in view (so it stays current
 * between deploys). Vercel's CDN keeps each answer for an hour: Apple is asked
 * at most a few times an hour, however many people visit.
 *
 * It never fails. Unconfigured, or with an expired token, it answers
 * `{ live: false }` and the page shows the frozen 2024 soundtrack instead.
 */
export type Soundtrack = ({ live: true } & Listening) | { live: false }

/** Same answer for every visitor: a warm instance need not ask Apple twice. */
const MEMO_MS = 10 * 60 * 1000
let memo: { value: Soundtrack, at: number } | undefined

async function load(): Promise<Soundtrack> {
  const { teamId, keyId, privateKey, userToken, storefront } = useRuntimeConfig().appleMusic

  if (!teamId || !keyId || !privateKey || !userToken) return { live: false }

  try {
    const history = await fetchHistory({ teamId, keyId, privateKey }, userToken)
    const listening = summariseHistory(history, { storefront: storefront || 'fr' })
    return listening.tracks.length > 0 ? { live: true, ...listening } : { live: false }
  }
  catch (error) {
    // 401/403 almost always means the Music User Token has lapsed: say how to
    // fix it, plainly, where the owner will look.
    if (error instanceof AppleMusicError && (error.status === 401 || error.status === 403)) {
      console.error(`[soundtrack] ${error.message} — renew NUXT_APPLE_MUSIC_USER_TOKEN with \`npm run apple-music:token\`.`)
    }
    else {
      console.error('[soundtrack] Apple Music unavailable:', error instanceof Error ? error.message : error)
    }
    return { live: false }
  }
}

export default defineEventHandler(async (event): Promise<Soundtrack> => {
  const now = Date.now()
  if (!memo || now - memo.at > MEMO_MS) memo = { value: await load(), at: now }

  // A fallback is cached briefly, so a renewed token shows up quickly.
  event.node.res.setHeader('cache-control', memo.value.live
    ? 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    : 'public, max-age=60, s-maxage=600')

  return memo.value
})
