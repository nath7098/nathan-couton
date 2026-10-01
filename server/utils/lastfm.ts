/**
 * Last.fm, read from the server: what Nathan has been listening to this month.
 *
 * He listens on Apple Music, which has no free way to read a listening
 * history (MusicKit needs a paid Apple Developer membership). A scrobbler on
 * the phone or the Mac sends each play to Last.fm instead, and Last.fm's API
 * is free: an API key, no OAuth, nothing that expires. It also counts plays
 * per period, so the ranking is a real "most played over 30 days".
 */

const API = 'https://ws.audioscrobbler.com/2.0/'

export interface LastfmCredentials {
  apiKey: string
  user: string
}

export interface ListenedTrack {
  title: string
  artist: string
  /** The track's Last.fm page; absent when Last.fm gives none. */
  href?: string
}

export interface Listening {
  tracks: ListenedTrack[]
  artists: string[]
}

/** Only what is read here. Last.fm sends a lone item as an object, not an array. */
interface TopTracksBody {
  toptracks?: { track?: OneOrMany<{ name?: string, url?: string, artist?: { name?: string } }> }
}
interface TopArtistsBody {
  topartists?: { artist?: OneOrMany<{ name?: string }> }
}
type OneOrMany<T> = T | T[]

export type Period = '7day' | '1month' | '3month' | '6month' | '12month' | 'overall'

/** Last.fm error codes that mean the configuration is wrong, not the service. */
export const CONFIG_ERRORS: Record<number, string> = {
  6: 'NUXT_LASTFM_USER (user not found)',
  10: 'NUXT_LASTFM_API_KEY (invalid key)',
  26: 'NUXT_LASTFM_API_KEY (key suspended)',
}

export class LastfmError extends Error {
  constructor(readonly status: number, readonly code: number | undefined, message: string) {
    super(message)
  }
}

async function call<T>(method: string, credentials: LastfmCredentials, params: Record<string, string>): Promise<T> {
  const url = new URL(API)
  url.search = new URLSearchParams({
    method, user: credentials.user, api_key: credentials.apiKey, format: 'json', ...params,
  }).toString()

  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  const body = await response.json().catch(() => ({})) as { error?: number, message?: string }
  // Errors come as { error, message }, sometimes with a 200.
  if (!response.ok || body.error) {
    const detail = body.error ? `, error ${body.error}: ${body.message}` : ''
    throw new LastfmError(response.status, body.error, `Last.fm ${method} failed (${response.status}${detail})`)
  }
  return body as T
}

/** Top tracks and artists over the period, in Last.fm's order (most played first). */
export async function fetchTopListening(
  credentials: LastfmCredentials,
  { period = '1month' as Period, tracks = 4, artists = 4 } = {},
): Promise<Listening> {
  const [tracksBody, artistsBody] = await Promise.all([
    call<TopTracksBody>('user.gettoptracks', credentials, { period, limit: String(tracks) }),
    call<TopArtistsBody>('user.gettopartists', credentials, { period, limit: String(artists) }),
  ])
  return summariseTopListening(tracksBody, artistsBody, { tracks, artists })
}

const list = <T>(value: OneOrMany<T> | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

/** Shapes the two answers for the page. Pure: tested without the network. */
export function summariseTopListening(
  tracksBody: TopTracksBody,
  artistsBody: TopArtistsBody,
  { tracks = 4, artists = 4 } = {},
): Listening {
  return {
    tracks: list(tracksBody.toptracks?.track)
      .flatMap((track) => {
        const title = track.name?.trim()
        const artist = track.artist?.name?.trim()
        if (!title || !artist) return []
        const href = track.url?.startsWith('https://www.last.fm/') ? track.url : undefined
        return [href ? { title, artist, href } : { title, artist }]
      })
      .slice(0, tracks),
    artists: list(artistsBody.topartists?.artist)
      .flatMap(artist => (artist.name?.trim() ? [artist.name.trim()] : []))
      .slice(0, artists),
  }
}
