import crypto from 'node:crypto'
import { Subscriber } from '../models/subscriber.js'

const SUBSCRIBER_PROJECTION = { _id: 0, __v: 0 }

function toPlainSubscriber(document) {
  const subscriber = document.toObject()
  delete subscriber._id
  delete subscriber.__v
  return subscriber
}

function createSubscriberId() {
  return `SUB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`
}

export async function subscribe({ email, name = null, source = 'drop-signup' }) {
  const key = String(email).toLowerCase()
  const now = new Date()
  const existing = await Subscriber.findOne({ email: key })

  if (existing) {
    const wasUnsubscribed = existing.status === 'unsubscribed'

    if (wasUnsubscribed) {
      existing.status = 'subscribed'
      existing.subscribedAt = now
      existing.unsubscribedAt = null
      existing.name = name || existing.name || null
      existing.source = source || existing.source
      existing.welcomeEmailSentAt = null
      await existing.save()
    }

    return {
      subscriber: toPlainSubscriber(existing),
      created: false,
      resubscribed: wasUnsubscribed,
    }
  }

  const subscriber = await Subscriber.create({
    id: createSubscriberId(),
    email: key,
    name: name || null,
    source: source || 'drop-signup',
    status: 'subscribed',
    token: crypto.randomBytes(24).toString('base64url'),
    subscribedAt: now,
    unsubscribedAt: null,
    welcomeEmailSentAt: null,
  })

  return {
    subscriber: toPlainSubscriber(subscriber),
    created: true,
    resubscribed: false,
  }
}

export async function getSubscriberByToken(token) {
  if (!token) return null

  return Subscriber.findOne({ token: String(token) }).lean()
}

export async function unsubscribe(token) {
  const subscriber = await Subscriber.findOne({ token: String(token) })
  if (!subscriber) return null

  if (subscriber.status !== 'unsubscribed') {
    subscriber.status = 'unsubscribed'
    subscriber.unsubscribedAt = new Date()
    await subscriber.save()
  }

  return toPlainSubscriber(subscriber)
}

export async function markWelcomeSent(subscriberId) {
  const subscriber = await Subscriber.findOneAndUpdate(
    { id: subscriberId },
    { $set: { welcomeEmailSentAt: new Date() } },
    { returnDocument: 'after', projection: SUBSCRIBER_PROJECTION },
  ).lean()

  return subscriber ?? null
}

export async function listSubscribers() {
  return Subscriber.find({})
    .select({ token: 0, _id: 0, __v: 0 })
    .sort({ subscribedAt: -1 })
    .lean()
}

export async function countActiveSubscribers() {
  return Subscriber.countDocuments({ status: 'subscribed' })
}
