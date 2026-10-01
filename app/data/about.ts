/**
 * The profile section's data.
 *
 * v1 fetched a live Spotify top list from a personal API; that account and the
 * API are gone (SPEC §13.1), and what was left was a frozen snapshot shown as
 * if it were current, with its artwork hot-linked from Spotify's and IGDB's
 * CDNs — URLs that expire, and that answer 403 from some networks. The page
 * now owns everything it shows: the playlist is text, and the one game that
 * matters is drawn with the Knight's own sprite, because the visitor will meet
 * him at the bottom of the page.
 *
 * The playlist is live again: this month's most played, Apple Music plays
 * scrobbled to Last.fm (GET /api/soundtrack) — still text only, no artwork.
 * What follows is its fallback: the 2024 snapshot, shown and dated as such
 * whenever Last.fm is unconfigured or unreachable.
 */
export interface Track {
  artist: string
  title: string
  href?: string
}

/** The last known top tracks, frozen in 2024. Never "right now". */
export const SOUNDTRACK_YEAR = 2024

export const SOUNDTRACK: readonly Track[] = [
  { artist: 'Sleep Token', title: 'Take Me Back To Eden', href: 'https://open.spotify.com/track/2Gt7fjNlx901pPRkvBiNBZ' },
  { artist: 'Periphery', title: 'Dracul Gras', href: 'https://open.spotify.com/track/23DnPpIoSRcYN04PI4bKku' },
  { artist: 'Sleep Token', title: 'Rain', href: 'https://open.spotify.com/track/0GXwlEXCO8qeeeOIYpsR3m' },
  { artist: 'Bad Omens', title: 'Like A Villain', href: 'https://open.spotify.com/track/0xoyUiHhxVH4gwb0CRgNmg' },
]

/** The top artists of the same snapshot. */
export const TOP_ARTISTS: readonly string[] = ['Sleep Token', 'Periphery', 'Bad Omens', 'Tenacious D']

/** Key figures. Values are computed or factual; labels live in the locales. */
export const FIGURE_IDS = ['years', 'esn', 'degree', 'english'] as const
export type FigureId = (typeof FIGURE_IDS)[number]

export const HOBBY_IDS = ['music', 'climbing', 'australia'] as const
