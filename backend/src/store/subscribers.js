import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'

const subscribers = new Map()

loadSubscribers()

function loadSubscribers() {
  try {
    const raw = fs.readFileSync(config.subscriberFile, 'utf8')
    const saved = JSON.parse(raw)

    if (!Array.isArray(saved)) return

    for (const subscriber of saved) {
      if (subscriber?.email) {
        subscribers.set(subscriber.email.toLowerCase(), subscriber)
      }
    }

    console.log(
      `[newsletter] Loaded ${subscribers.size} subscriber(s) from ${config.subscriberFile}`,
    )
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(
        '[newsletter] Could not read saved subscribers:',
        error.message,
      )
    }
  }
}

function persistSubscribers() {
  try {
    fs.mkdirSync(path.dirname(config.subscriberFile), { recursive: true })
    const temporaryFile = `${config.subscriberFile}.tmp`
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify([...subscribers.values()], null, 2),
      'utf8',
    )
    fs.renameSync(temporaryFile, config.subscriberFile)
  } catch (error) {
    console.error('[newsletter] Could not save subscribers:', error.message)
  }
}

function createSubscriberId() {
  return `SUB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`
}

export function subscribe({ email, name = null, source = 'drop-signup' }) {
  const key = email.toLowerCase()
  const existing = subscribers.get(key)
  const now = new Date().toISOString()

  if (existing) {
    const wasUnsubscribed = existing.status === 'unsubscribed'

    if (wasUnsubscribed) {
      existing.status = 'subscribed'
      existing.subscribedAt = now
      existing.unsubscribedAt = null
      existing.name = name || existing.name || null
      existing.source = source || existing.source
      existing.welcomeEmailSentAt = null
      persistSubscribers()
    }

    return { subscriber: existing, created: false, resubscribed: wasUnsubscribed }
  }

  const subscriber = {
    id: createSubscriberId(),
    email: key,
    name: name || null,
    source: source || 'drop-signup',
    status: 'subscribed',
    token: crypto.randomBytes(24).toString('base64url'),
    subscribedAt: now,
    unsubscribedAt: null,
    welcomeEmailSentAt: null,
  }

  subscribers.set(key, subscriber)
  persistSubscribers()

  return { subscriber, created: true, resubscribed: false }
}

export function getSubscriberByToken(token) {
  if (!token) return null

  for (const subscriber of subscribers.values()) {
    if (subscriber.token === token) return subscriber
  }

  return null
}

export function unsubscribe(token) {
  const subscriber = getSubscriberByToken(token)
  if (!subscriber) return null

  if (subscriber.status !== 'unsubscribed') {
    subscriber.status = 'unsubscribed'
    subscriber.unsubscribedAt = new Date().toISOString()
    persistSubscribers()
  }

  return subscriber
}

export function markWelcomeSent(subscriberId) {
  const subscriber = [...subscribers.values()].find(
    (item) => item.id === subscriberId,
  )

  if (!subscriber) return null

  subscriber.welcomeEmailSentAt = new Date().toISOString()
  persistSubscribers()
  return subscriber
}

export function listSubscribers() {
  return [...subscribers.values()]
    .sort((a, b) => String(b.subscribedAt).localeCompare(String(a.subscribedAt)))
    .map(({ token: _token, ...subscriber }) => subscriber)
}

export function countActiveSubscribers() {
  return [...subscribers.values()].filter(
    (subscriber) => subscriber.status === 'subscribed',
  ).length
}
