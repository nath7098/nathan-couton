import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { developerToken, normalisePem, summariseHistory, type HistoryItem } from '../../server/utils/apple-music'

const song = (name: string, artistName: string, extra: Partial<HistoryItem> = {}): HistoryItem => ({
  type: 'songs',
  id: `${name}-${artistName}`.replace(/\W/g, ''),
  ...extra,
  attributes: { name, artistName, url: `https://music.apple.com/fr/song/${name.replace(/\W/g, '')}`, ...extra.attributes },
})

describe('developerToken', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()

  it('signs an ES256 JWT that verifies against the key', () => {
    const token = developerToken({ teamId: 'TEAM', keyId: 'KEY', privateKey: pem }, 1_000)
    const [header, payload, signature] = token.split('.')

    expect(JSON.parse(Buffer.from(header!, 'base64url').toString())).toEqual({ alg: 'ES256', kid: 'KEY' })
    expect(JSON.parse(Buffer.from(payload!, 'base64url').toString())).toEqual({ iss: 'TEAM', iat: 1_000, exp: 1_000 + 86_400 })

    // A JWS ES256 signature is the raw 64-byte r‖s, not DER.
    const raw = Buffer.from(signature!, 'base64url')
    expect(raw).toHaveLength(64)
    expect(verify('sha256', Buffer.from(`${header}.${payload}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, raw)).toBe(true)
  })

  it('accepts a key whose newlines were escaped in an env var', () => {
    const flattened = pem.trim().replace(/\n/g, '\\n')
    expect(normalisePem(flattened)).toBe(pem.trim())
    expect(() => createPublicKey(normalisePem(flattened))).not.toThrow()
    expect(developerToken({ teamId: 'T', keyId: 'K', privateKey: flattened }).split('.')).toHaveLength(3)
  })
})

describe('summariseHistory', () => {
  it('ranks tracks by plays within the window, then by recency', () => {
    const { tracks } = summariseHistory([
      song('Rain', 'Sleep Token'),
      song('Like A Villain', 'Bad Omens'),
      song('Rain', 'Sleep Token'),
      song('Dracul Gras', 'Periphery'),
      song('Like A Villain', 'Bad Omens'),
      song('Rain', 'Sleep Token'),
      song('Blood Hunter', 'Polyphia'),
      song('Tribute', 'Tenacious D'),
    ])
    expect(tracks.map(track => track.title)).toEqual(['Rain', 'Like A Villain', 'Dracul Gras', 'Blood Hunter'])
  })

  it('counts an artist once per play, across all their tracks', () => {
    const { artists } = summariseHistory([
      song('Tribute', 'Tenacious D'),
      song('Rain', 'Sleep Token'),
      song('Granite', 'Sleep Token'),
      song('Vore', 'Sleep Token'),
      song('Dracul Gras', 'Periphery'),
      song('Marigold', 'Periphery'),
    ])
    expect(artists).toEqual(['Sleep Token', 'Periphery', 'Tenacious D'])
  })

  it('treats a catalog play and a library play of one song as the same track', () => {
    const { tracks } = summariseHistory([
      { type: 'library-songs', id: 'i.abc', attributes: { name: 'Rain', artistName: 'Sleep Token', playParams: { catalogId: '1667707413' } } },
      song('Rain', 'sleep token'),
    ], { storefront: 'gb' })
    expect(tracks).toEqual([{ title: 'Rain', artist: 'Sleep Token', href: 'https://music.apple.com/gb/song/1667707413' }])
  })

  it('links only to Apple Music, and leaves a personal upload unlinked', () => {
    const { tracks } = summariseHistory([
      { type: 'library-songs', id: 'i.upload', attributes: { name: 'Démo', artistName: 'Nathan' } },
      { type: 'songs', id: '42', attributes: { name: 'Odd', artistName: 'Someone', url: 'javascript:alert(1)' } },
    ])
    expect(tracks[0]).toEqual({ title: 'Démo', artist: 'Nathan', href: undefined })
    expect(tracks[1]!.href).toBe('https://music.apple.com/fr/song/42')
  })

  it('skips items without a title or an artist, and caps both lists', () => {
    const history = [
      { type: 'songs', id: 'x', attributes: { name: '   ' } },
      ...Array.from({ length: 10 }, (_, i) => song(`Track ${i}`, `Artist ${i}`)),
    ]
    const { tracks, artists } = summariseHistory(history)
    expect(tracks).toHaveLength(4)
    expect(artists).toEqual(['Artist 0', 'Artist 1', 'Artist 2', 'Artist 3'])
  })

  it('returns empty lists for an empty history', () => {
    expect(summariseHistory([])).toEqual({ tracks: [], artists: [] })
  })
})
