import { markWelcomeSent } from '../store/subscribers.js'
import { sendWelcomeEmail as deliverWelcomeEmail } from './email.js'

export async function sendSubscriberWelcome(subscriber) {
  if (subscriber.welcomeEmailSentAt) {
    return { status: 'already-sent', sent: false }
  }

  const result = await deliverWelcomeEmail(subscriber)

  if (result.status === 'sent' || result.status === 'logged') {
    await markWelcomeSent(subscriber.id)
  }

  return result
}
