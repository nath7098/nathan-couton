import { createPrivateKey, sign } from 'node:crypto'

/**
 * Apple Music, read from the server: what Nathan has been listening to lately.
 *
 * Two tokens are needed. The developer token is a JWT signed here with the
 * MusicKit key (.p8): it is minted on demand, so nothing expires on that side.
 * The Music User Token authorises reading one person's history; it can only
 * be obtained in a browser through MusicKit JS (`npm run apple-music:token`)
 * and Apple lets it lapse after a few months. When it does, the API answers
 * 401/403, the route says so in the logs, and the page falls back on the
 * frozen 2024 soundtrack — it never breaks.
 *
 * Apple only remembers the last 50 tracks played, without timestamps. The
 * ranking is therefore "lately", not "this year": tracks by play count within
 * that window, then by recency; artists by how many of those plays are theirs.
 */

const API = 'https://api.music.apple.com'

/** Apple's ceiling for the recently played history, and its page size. */
const HISTORY_SIZE = 50
const PAGE_SIZE = 30

/** Developer tokens may live up to six months; a day is plenty and limits a leak. */
const TOKEN_TTL_S = 24 * 60 * 60

export interface AppleMusicCredentials {
  teamId: string
  keyId: string
  /** The .p8 file's contents. Escaped newlines (`\n`) are accepted, as env vars often carry them. */
  privateKey: string
}

export interface ListenedTrack {
  title: string
  artist: string
  /** Absent when Apple gives no catalog match (a personal upload, say). */
  href?: string
}

export interface Listening {
  tracks: ListenedTrack[]
  artists: string[]
}

/** What the API returns for one item of the history. Only what is read here. */
export interface HistoryItem {
  id?: string
  type?: string
  attributes?: {
    name?: string
    artistName?: string
    url?: string
    playParams?: { catalogId?: string }
  }
}

const base64url = (input: Buffer | string) => Buffer.from(input).toString('base64url')

/** Restores the newlines a PEM loses when pasted into a single-line env var. */
export function normalisePem(key: string): string {
  return key.trim().replace(/\\n/g, '\n')
}

/** Signs an ES256 developer token, as Apple's MusicKit expects. */
export function developerToken(credentials: AppleMusicCredentials, nowS = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: 'ES256', kid: credentials.keyId }))
  const payload = base64url(JSON.stringify({ iss: credentials.teamId, iat: nowS, exp: nowS + TOKEN_TTL_S }))
  const key = createPrivateKey(normalisePem(credentials.privateKey))
  // JWS wants the raw r‖s signature, not the DER that Node produces by default.
  const signature = sign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' })
  return `${header}.${payload}.${base64url(signature)}`
}

/** One token per warm instance, renewed an hour before it lapses. */
let cached: { token: string, expiresAt: number } | undefined

function cachedDeveloperToken(credentials: AppleMusicCredentials): string {
  const nowS = Math.floor(Date.now() / 1000)
  if (!cached || cached.expiresAt - 3600 <= nowS) {
    cached = { token: developerToken(credentials, nowS), expiresAt: nowS + TOKEN_TTL_S }
  }
  return cached.token
}

export class AppleMusicError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

/** The whole remembered history, newest first — two pages at most. */
export async function fetchHistory(
  credentials: AppleMusicCredentials,
  userToken: string,
): Promise<HistoryItem[]> {
  const headers = {
    'authorization': `Bearer ${cachedDeveloperToken(credentials)}`,
    'music-user-token': userToken,
  }
  const items: HistoryItem[] = []
  let next: string | undefined = `/v1/me/recent/played/tracks?types=songs,library-songs&limit=${PAGE_SIZE}`

  while (next && items.length < HISTORY_SIZE) {
    const response = await fetch(`${API}${next}`, { headers, signal: AbortSignal.timeout(5000) })
    if (!response.ok) {
      throw new AppleMusicError(response.status, `Apple Music replied ${response.status} on ${next}`)
    }
    const body = await response.json() as { data?: HistoryItem[], next?: string }
    items.push(...(body.data ?? []))
    next = body.next
  }
  return items.slice(0, HISTORY_SIZE)
}

/** A public link for the track: the catalog URL, or one built from the catalog id. */
function linkFor(item: HistoryItem, storefront: string): string | undefined {
  const { url, playParams } = item.attributes ?? {}
  if (url?.startsWith('https://music.apple.com/')) return url
  if (playParams?.catalogId) return `https://music.apple.com/${storefront}/song/${playParams.catalogId}`
  if (item.type === 'songs' && item.id) return `https://music.apple.com/${storefront}/song/${item.id}`
  return undefined
}

/**
 * Ranks the history. The same song can appear as a catalog item and as a
 * library item, so tracks are matched on title and artist, not on id.
 */
export function summariseHistory(
  history: readonly HistoryItem[],
  { storefront = 'fr', tracks = 4, artists = 4 } = {},
): Listening {
  const byTrack = new Map<string, { track: ListenedTrack, plays: number, first: number }>()
  const byArtist = new Map<string, { name: string, plays: number, first: number }>()

  history.forEach((item, index) => {
    const title = item.attributes?.name?.trim()
    const artist = item.attributes?.artistName?.trim()
    if (!title || !artist) return

    const trackKey = `${title.toLowerCase()}\u0000${artist.toLowerCase()}`
    const seen = byTrack.get(trackKey)
    if (seen) {
      seen.plays++
      seen.track.href ??= linkFor(item, storefront)
    }
    else {
      byTrack.set(trackKey, { track: { title, artist, href: linkFor(item, storefront) }, plays: 1, first: index })
    }

    const artistKey = artist.toLowerCase()
    const known = byArtist.get(artistKey)
    if (known) known.plays++
    else byArtist.set(artistKey, { name: artist, plays: 1, first: index })
  })

  const rank = <T extends { plays: number, first: number }>(a: T, b: T) => b.plays - a.plays || a.first - b.first

  return {
    tracks: [...byTrack.values()].sort(rank).slice(0, tracks).map(({ track }) => track),
    artists: [...byArtist.values()].sort(rank).slice(0, artists).map(({ name }) => name),
  }
}
