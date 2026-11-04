import { Router } from 'express'
import { normalizeEmail } from '../validation.js'
import {
  getSubscriberByToken,
  subscribe,
  unsubscribe,
} from '../store/subscribers.js'
import { sendSubscriberWelcome } from '../services/newsletterEmails.js'

const router = Router()
const attempts = new Map()
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 20

function allowAttempt(ip) {
  const now = Date.now()
  const record = attempts.get(ip)

  if (!record || now - record.startedAt > WINDOW_MS) {
    attempts.set(ip, { startedAt: now, count: 1 })
    return true
  }

  record.count += 1
  return record.count <= MAX_ATTEMPTS
}

router.post('/', async (request, response) => {
  const ip = request.ip || request.socket?.remoteAddress || 'unknown'

  if (!allowAttempt(ip)) {
    return response.status(429).json({
      error: 'Too many signup attempts. Please wait a few minutes and try again.',
    })
  }

  const email = normalizeEmail(request.body?.email)
  const name = String(request.body?.name ?? '').trim().slice(0, 120) || null
  const source =
    String(request.body?.source ?? 'drop-signup').trim().slice(0, 40) ||
    'drop-signup'

  if (!email) {
    return response.status(400).json({
      error: 'Enter a valid email address.',
      fields: { email: 'Enter a valid email address.' },
    })
  }

  const { subscriber, created, resubscribed } = subscribe({
    email,
    name,
    source,
  })

  const shouldWelcome =
    (created || resubscribed) && !subscriber.welcomeEmailSentAt
  let emailStatus = null

  if (shouldWelcome) {
    const result = await sendSubscriberWelcome(subscriber).catch((error) => ({
      status: 'failed',
      emailError: error.message,
    }))
    emailStatus = result.status
  }

  return response.status(created ? 201 : 200).json({
    message: created
      ? "You're on the list. Check your inbox for a welcome email."
      : resubscribed
        ? "You're back on the list."
        : "You're already on the list.",
    subscribed: true,
    emailStatus,
  })
})

router.get('/unsubscribe', (request, response) => {
  const token = String(request.query.token ?? '').trim()

  if (!token) {
    return response.status(400).json({ error: 'Missing unsubscribe token.' })
  }

  const subscriber = getSubscriberByToken(token)

  if (!subscriber) {
    return response.status(404).json({
      error: 'That unsubscribe link is invalid or has expired.',
    })
  }

  unsubscribe(token)

  return response.json({
    ok: true,
    email: subscriber.email,
    message: `${subscriber.email} has been removed from the drop list.`,
  })
})

export default router
