import { describe, expect, it } from 'vitest'
import { LIMITS, validateContact } from '../../server/utils/contact-validation'

const valid = {
  name: 'Nathan',
  email: 'nathan@example.com',
  message: 'Bonjour, je vous contacte au sujet de votre portfolio.',
  elapsed: 9000,
}

const codes = (input: unknown) => validateContact(input).map(i => `${i.field}:${i.code}`)

describe('validateContact', () => {
  it('accepts a well-formed message', () => {
    expect(validateContact(valid)).toEqual([])
  })

  it('rejects anything that is not an object', () => {
    expect(codes(null)).toEqual(['form:malformed'])
    expect(codes('hello')).toEqual(['form:malformed'])
  })

  it('requires all three fields', () => {
    expect(codes({})).toEqual(['name:required', 'email:required', 'message:required'])
  })

  it('treats whitespace as empty', () => {
    expect(codes({ ...valid, name: '   ' })).toContain('name:required')
  })

  it('enforces lengths at the boundaries', () => {
    expect(codes({ ...valid, name: 'a' })).toContain('name:tooShort')
    expect(codes({ ...valid, name: 'ab' })).toEqual([])
    expect(codes({ ...valid, name: 'a'.repeat(LIMITS.name.max + 1) })).toContain('name:tooLong')

    expect(codes({ ...valid, message: 'a'.repeat(LIMITS.message.min - 1) })).toContain('message:tooShort')
    expect(codes({ ...valid, message: 'a'.repeat(LIMITS.message.min) })).toEqual([])
    expect(codes({ ...valid, message: 'a'.repeat(LIMITS.message.max + 1) })).toContain('message:tooLong')
  })

  it('checks the email shape', () => {
    for (const email of ['no-at', 'a@b', 'a@b.c', '@example.com', 'a b@example.com']) {
      expect(codes({ ...valid, email }), email).toContain('email:invalid')
    }
    for (const email of ['a@b.co', 'nathan.couton+tag@sub.example.fr']) {
      expect(codes({ ...valid, email }), email).toEqual([])
    }
  })

  it('flags a filled honeypot', () => {
    expect(codes({ ...valid, company: 'Acme' })).toContain('form:spam')
    expect(codes({ ...valid, company: '' })).toEqual([])
  })

  it('flags a submission faster than a person could type', () => {
    expect(codes({ ...valid, elapsed: 200 })).toContain('form:tooFast')
    expect(codes({ ...valid, elapsed: LIMITS.minElapsedMs })).toEqual([])
    // A missing timer is not an accusation.
    expect(codes({ ...valid, elapsed: undefined })).toEqual([])
  })
})
