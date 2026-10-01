/**
 * Where things stand — the "now" of the page.
 *
 * Everything time-dependent on the site is computed from `CONTENT_AS_OF`, never
 * from `new Date()`. The page is prerendered: a date read at render time and
 * again at hydration can disagree (a build in September, a visit in January),
 * and the difference is a hydration mismatch. The price is that this constant
 * has to be moved when the content is — which is also when it is true.
 */
export const CONTENT_AS_OF = { year: 2026, month: 9 } as const

/** First day in the job after the degree: January 2021, ACII by Audensiel. */
export const CAREER_START = { year: 2021, month: 1 } as const

export interface NowStatus {
  /** In a mission, or free to start one. */
  status: 'mission' | 'available'
  client: string
  employer: string
  city: string
  /** Shown in the header pill. Off by default: it is not the site's to say. */
  openToOffers: boolean
}

export const NOW: NowStatus = {
  status: 'mission',
  client: 'Harmonie Mutuelle',
  employer: 'Catamania',
  city: 'Tours',
  openToOffers: false,
}

/** Whole years between two year-months. */
export function yearsBetween(
  from: { year: number, month: number },
  to: { year: number, month: number } = CONTENT_AS_OF,
): number {
  return Math.floor(((to.year - from.year) * 12 + (to.month - from.month)) / 12)
}

/** Years in the job, as of the content date. */
export const YEARS_OF_EXPERIENCE = yearsBetween(CAREER_START)
