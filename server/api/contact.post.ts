import { rateLimit } from '../utils/rate-limit'
import { validateContact, type ContactPayload } from '../utils/contact-validation'

/**
 * The site's only serverless function (SPEC §2).
 *
 * It exists so the mail credentials never reach the bundle and so there is
 * somewhere to enforce a rate limit. Everything else about the site is static.
 */

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Behind Vercel the socket address is the proxy; the forwarded header is the
  // client. Falls back to the socket so a local run still limits something.
  // Node's own headers: h3's helpers are typed against two different copies of
  // the library in this install, and these are stable either way.
  const headers = event.node.req.headers
  const forwarded = headers['x-forwarded-for']
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const realIp = headers['x-real-ip']
  const ip = firstForwarded?.split(',')[0]?.trim()
    || (Array.isArray(realIp) ? realIp[0] : realIp)
    || event.node.req.socket.remoteAddress
    || 'unknown'

  const limit = rateLimit(`contact:${ip}`, MAX_PER_WINDOW, WINDOW_MS)
  event.node.res.setHeader('x-ratelimit-remaining', String(limit.remaining))

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000)
    event.node.res.setHeader('retry-after', String(retryAfter))
    throw createError({ statusCode: 429, statusMessage: 'Too many messages. Try again later.' })
  }

  const body = await readBody<ContactPayload>(event)
  const issues = validateContact(body)

  if (issues.length > 0) {
    // Spam traps answer 200: telling a bot why it failed only helps it.
    if (issues.some(issue => issue.field === 'form' && (issue.code === 'spam' || issue.code === 'tooFast'))) {
      return { ok: true }
    }
    throw createError({ statusCode: 422, statusMessage: 'Invalid submission', data: { issues } })
  }

  const { serviceId, templateId, publicKey, privateKey } = config.emailjs

  if (!serviceId || !templateId || !publicKey) {
    // Misconfiguration is ours, not the sender's: say so plainly in the logs
    // and give them the generic failure, which names the direct address.
    console.error('[contact] EmailJS is not configured; message dropped.')
    throw createError({ statusCode: 503, statusMessage: 'Mail service unavailable' })
  }

  const response = await $fetch.raw('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      // Sending the private key makes the call server-only: a copy of the
      // public key alone cannot post through this template.
      ...(privateKey ? { accessToken: privateKey } : {}),
      template_params: {
        name: body.name.trim(),
        email: body.email.trim(),
        content: body.message.trim(),
      },
    },
    ignoreResponseError: true,
  })

  if (response.status >= 400) {
    console.error(`[contact] EmailJS replied ${response.status}: ${response._data}`)
    throw createError({ statusCode: 502, statusMessage: 'Mail service refused the message' })
  }

  return { ok: true }
})
