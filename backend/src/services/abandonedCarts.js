import { config } from '../config.js'
import { getAllOrders } from '../store/orders.js'
import { sendAbandonedCartReminder } from './orderEmails.js'

const MINUTE = 60 * 1000

let sweeping = false
let timer = null

async function sweep() {
  if (sweeping) return
  sweeping = true

  try {
    const now = Date.now()
    const reminderCutoff =
      now - Math.max(1, config.abandonedCart.delayMinutes) * MINUTE
    const oldestAllowed =
      now - Math.max(1, config.abandonedCart.maxAgeDays) * 24 * 60 * MINUTE

    const candidates = (await getAllOrders()).filter((order) => {
      if (!['pending_payment', 'payment_failed'].includes(order.status)) {
        return false
      }

      if (order.emails?.abandonedCartSentAt) return false

      const createdAt = new Date(order.createdAt).getTime()
      return (
        Number.isFinite(createdAt) &&
        createdAt <= reminderCutoff &&
        createdAt >= oldestAllowed
      )
    })

    for (const order of candidates) {
      try {
        const result = await sendAbandonedCartReminder(order)

        if (result.status === 'sent' || result.status === 'logged') {
          console.log(
            `[abandoned-cart] Reminder ${result.status} for order ${order.id}.`,
          )
        }
      } catch (error) {
        console.error(
          `[abandoned-cart] Could not send reminder for ${order.id}:`,
          error.message,
        )
      }
    }
  } catch (error) {
    console.error('[abandoned-cart] Sweep failed:', error.message)
  } finally {
    sweeping = false
  }
}

export function startAbandonedCartSweeper() {
  if (!config.abandonedCart.enabled) {
    console.log('[abandoned-cart] Disabled by configuration.')
    return
  }

  const intervalMs =
    Math.max(1, config.abandonedCart.sweepMinutes) * MINUTE

  timer = setInterval(sweep, intervalMs)
  timer.unref?.()

  const initialTimer = setTimeout(sweep, 10_000)
  initialTimer.unref?.()

  console.log(
    `[abandoned-cart] Enabled: reminders after ${config.abandonedCart.delayMinutes} minutes, checked every ${config.abandonedCart.sweepMinutes} minutes.`,
  )
}

export function stopAbandonedCartSweeper() {
  if (timer) clearInterval(timer)
  timer = null
}
