/**
 * Validation shared in spirit with the client form, but re-run here: the
 * browser's checks are a convenience, the server's are the rule.
 */
export interface ContactPayload {
  name: string
  email: string
  message: string
  /** Honeypot: must stay empty. Real people never see this field. */
  company?: string
  /** Milliseconds the form was open before submitting. */
  elapsed?: number
}

export interface ValidationIssue {
  field: 'name' | 'email' | 'message' | 'form'
  code: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const LIMITS = {
  name: { min: 2, max: 120 },
  email: { max: 200 },
  message: { min: 10, max: 2000 },
  /** Anything faster than this was not typed by a person. */
  minElapsedMs: 1500,
} as const

export function validateContact(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (typeof input !== 'object' || input === null) {
    return [{ field: 'form', code: 'malformed' }]
  }

  const body = input as Record<string, unknown>
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name) issues.push({ field: 'name', code: 'required' })
  else if (name.length < LIMITS.name.min) issues.push({ field: 'name', code: 'tooShort' })
  else if (name.length > LIMITS.name.max) issues.push({ field: 'name', code: 'tooLong' })

  if (!email) issues.push({ field: 'email', code: 'required' })
  else if (!EMAIL.test(email) || email.length > LIMITS.email.max) {
    issues.push({ field: 'email', code: 'invalid' })
  }

  if (!message) issues.push({ field: 'message', code: 'required' })
  else if (message.length < LIMITS.message.min) issues.push({ field: 'message', code: 'tooShort' })
  else if (message.length > LIMITS.message.max) issues.push({ field: 'message', code: 'tooLong' })

  // Bots fill every field they find, including the hidden one.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    issues.push({ field: 'form', code: 'spam' })
  }

  if (typeof body.elapsed === 'number' && body.elapsed >= 0 && body.elapsed < LIMITS.minElapsedMs) {
    issues.push({ field: 'form', code: 'tooFast' })
  }

  return issues
}
