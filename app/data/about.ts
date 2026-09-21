/**
 * About-scene content, frozen.
 *
 * v1 fetched these from a personal Express API backed by the Spotify API. That
 * account is gone and the API is retired (SPEC §13.1), so the last known state
 * is inlined here. The lists will not move again; the tile is titled "my top",
 * never "right now".
 *
 * Remote images: the Spotify and IGDB URLs are third-party CDNs that can expire.
 * `scripts/fetch-remote-assets.mjs` downloads them into public/img/ — run it
 * once locally, then point these at the local copies.
 */
export interface MediaItem {
  name: string
  image: string
  /** Optional caption shown under the name. */
  by?: string
  href?: string
}

export const TOP_ARTISTS: readonly MediaItem[] = [
  {
    name: 'Sleep Token',
    href: 'https://open.spotify.com/artist/2n2RSaZqBuUUukhbLlpnE6',
    image: 'https://i.scdn.co/image/ab6761610000e5ebdbc568c9d871256b9a3e34a1',
  },
  {
    name: 'Periphery',
    href: 'https://open.spotify.com/artist/6d24kC5fxHFOSEAmjQPPhc',
    image: 'https://i.scdn.co/image/ab6761610000e5ebae2304891734b9d9fafe1c8d',
  },
  {
    name: 'Bad Omens',
    href: 'https://open.spotify.com/artist/3Ri4H12KFyu98LMjSoij5V',
    image: 'https://i.scdn.co/image/ab6761610000e5eb1ffa2e19b87dceb11074b564',
  },
  {
    name: 'Tenacious D',
    href: 'https://open.spotify.com/artist/1XpDYCrUJnvCo9Ez6yeMWh',
    image: 'https://i.scdn.co/image/ab6761610000e5eb7637f18f419921b8d24bd9e5',
  },
]

export const TOP_TRACKS: readonly MediaItem[] = [
  {
    name: 'Take Me Back To Eden',
    by: 'Sleep Token',
    href: 'https://open.spotify.com/track/2Gt7fjNlx901pPRkvBiNBZ',
    image: 'https://i.scdn.co/image/ab67616d0000b273c3d08e1763e769586bab1c97',
  },
  {
    name: 'Dracul Gras',
    by: 'Periphery',
    href: 'https://open.spotify.com/track/23DnPpIoSRcYN04PI4bKku',
    image: 'https://i.scdn.co/image/ab67616d0000b273fef6779b6098e01e5e4a68f7',
  },
  {
    name: 'Rain',
    by: 'Sleep Token',
    href: 'https://open.spotify.com/track/0GXwlEXCO8qeeeOIYpsR3m',
    image: 'https://i.scdn.co/image/ab67616d0000b273c3d08e1763e769586bab1c97',
  },
  {
    name: 'Like A Villain',
    by: 'Bad Omens',
    href: 'https://open.spotify.com/track/0xoyUiHhxVH4gwb0CRgNmg',
    image: 'https://i.scdn.co/image/ab67616d0000b273e5f6f7ec99735d7b870f18ae',
  },
]

export const GAMES: readonly MediaItem[] = [
  {
    name: 'Hollow Knight',
    image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hc2.png',
  },
  {
    name: 'Final Fantasy X',
    image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tr1.png',
  },
]

/** Hobby labels come from i18n; only the images are local. */
export const HOBBIES = [
  { id: 'music', labelKey: 'about.hobbies.music', image: '/img/about/musique.jpg' },
  { id: 'australia', labelKey: 'about.hobbies.australia', image: '/img/about/australie.jpg' },
] as const
