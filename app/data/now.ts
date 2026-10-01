/**
 * Where things stand — the "now" of the page.
 *
 * Everything time-dependent on the site — years of experience, years per
 * skill, the copyright year, the CV's date — is computed from `CONTENT_AS_OF`,
 * never from `new Date()` at render time. The page is prerendered: a date read
 * at render time and again at hydration can disagree (a build in September, a
 * visit in January), and the difference is a hydration mismatch.
 *
 * So the date is the build's: nuxt.config.ts stamps `__NC_BUILT__` (year-month)
 * into both the server and the client bundle of the same build, and they can
 * never disagree. Every deploy moves it forward on its own. Outside a Nuxt
 * build (unit tests, `npm run cv`), it is simply today.
 */
declare const __NC_BUILT__: string | undefined

export interface YearMonthParts { year: number, month: number }

/** `'2025-07'` → `{ year: 2025, month: 7 }`. */
export function parseYearMonth(value: string): YearMonthParts {
  const [year, month] = value.split('-').map(Number)
  return { year: year!, month: month! }
}

function today(): YearMonthParts {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export const CONTENT_AS_OF: YearMonthParts = typeof __NC_BUILT__ === 'string'
  ? parseYearMonth(__NC_BUILT__)
  : today()

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
  from: YearMonthParts,
  to: YearMonthParts = CONTENT_AS_OF,
): number {
  return Math.floor(((to.year - from.year) * 12 + (to.month - from.month)) / 12)
}

/** Years in the job, as of the content date. */
export const YEARS_OF_EXPERIENCE = yearsBetween(CAREER_START)
