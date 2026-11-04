import { getOrderById, updateOrder } from '../store/orders.js'
import {
  sendAbandonedCartEmail as deliverAbandonedCart,
  sendOrderConfirmationEmail as deliverOrderConfirmation,
  sendPaymentReceiptEmail as deliverPaymentReceipt,
  sendShippedEmail as deliverShippedEmail,
} from './email.js'

function wasProcessed(status) {
  return status === 'sent' || status === 'logged'
}

export async function sendOrderConfirmationEmail(order) {
  const freshOrder = getOrderById(order.id)

  if (!freshOrder) {
    return { status: 'failed', sent: false, error: 'Order not found.' }
  }

  if (freshOrder.emails?.orderConfirmationSentAt) {
    return { status: 'already-sent', sent: false }
  }

  const result = await deliverOrderConfirmation(freshOrder)

  if (wasProcessed(result.status)) {
    updateOrder(order.id, (draft) => {
      draft.emails.orderConfirmationSentAt = new Date().toISOString()
    })
  }

  return result
}

export async function sendPaymentReceiptEmail(order) {
  const freshOrder = getOrderById(order.id)

  if (!freshOrder) {
    return { status: 'failed', sent: false, error: 'Order not found.' }
  }

  if (freshOrder.emails?.paymentReceiptSentAt) {
    return { status: 'already-sent', sent: false }
  }

  const result = await deliverPaymentReceipt(freshOrder)

  if (wasProcessed(result.status)) {
    updateOrder(order.id, (draft) => {
      draft.emails.paymentReceiptSentAt = new Date().toISOString()
    })
  }

  return result
}

export async function sendAbandonedCartReminder(order) {
  const freshOrder = getOrderById(order.id)

  if (!freshOrder) {
    return { status: 'failed', sent: false, error: 'Order not found.' }
  }

  if (freshOrder.emails?.abandonedCartSentAt) {
    return { status: 'already-sent', sent: false }
  }

  if (freshOrder.status === 'paid') {
    return { status: 'skipped', sent: false }
  }

  const result = await deliverAbandonedCart(freshOrder)

  if (wasProcessed(result.status)) {
    updateOrder(order.id, (draft) => {
      draft.emails.abandonedCartSentAt = new Date().toISOString()
    })
  }

  return result
}

export async function sendShippedEmail(order) {
  const freshOrder = getOrderById(order.id)

  if (!freshOrder) {
    return { status: 'failed', sent: false, error: 'Order not found.' }
  }

  if (freshOrder.emails?.shippedEmailSentAt) {
    return { status: 'already-sent', sent: false }
  }

  const result = await deliverShippedEmail(freshOrder)

  if (wasProcessed(result.status)) {
    updateOrder(order.id, (draft) => {
      draft.emails.shippedEmailSentAt = new Date().toISOString()
    })
  }

  return result
}
