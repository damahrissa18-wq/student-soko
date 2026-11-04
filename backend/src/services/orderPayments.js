import { getOrderById, updateOrder } from '../store/orders.js'
import { decrementStock } from '../store/inventory.js'
import { sendPaymentReceiptEmail } from './orderEmails.js'

export async function markOrderPaid(
  orderId,
  { receiptNumber, phoneNumber, paidAt } = {},
) {
  const existing = getOrderById(orderId)
  if (!existing) return null

  const wasAlreadyPaid = existing.status === 'paid'
  let stockDebitPending = false

  const order = updateOrder(orderId, (draft) => {
    if (draft.status === 'paid') return

    draft.status = 'paid'
    draft.payment.status = 'paid'
    draft.payment.receiptNumber =
      receiptNumber ?? draft.payment.receiptNumber ?? null
    draft.payment.paidAt = paidAt ?? new Date().toISOString()
    draft.payment.phoneNumber = phoneNumber ?? draft.customer.phone
    draft.payment.message = 'Payment received.'

    if (!draft.stockAdjustedAt) {
      draft.stockAdjustedAt = new Date().toISOString()
      stockDebitPending = true
    }
  })

  if (!order) return null

  if (stockDebitPending) {
    decrementStock(order.items)
  }

  if (
    (!wasAlreadyPaid || order.status === 'paid') &&
    !order.emails?.paymentReceiptSentAt
  ) {
    await sendPaymentReceiptEmail(order)
  }

  return getOrderById(orderId)
}
