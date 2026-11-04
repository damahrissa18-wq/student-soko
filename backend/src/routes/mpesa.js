import { Router } from 'express'
import {
  getOrderByCheckoutRequestId,
  updateOrder,
} from '../store/orders.js'
import { readCallback } from '../services/mpesa.js'
import { markOrderPaid } from '../services/orderPayments.js'

const router = Router()
const SAFARICOM_ACKNOWLEDGEMENT = { ResultCode: 0, ResultDesc: 'Success' }

router.post('/callback', async (request, response) => {
  try {
    const event = readCallback(request.body)

    if (!event) {
      console.warn('[mpesa] Ignoring a malformed callback.')
      return response.status(200).json(SAFARICOM_ACKNOWLEDGEMENT)
    }

    const order = getOrderByCheckoutRequestId(event.checkoutRequestId)

    if (!order || order.payment?.checkoutRequestId !== event.checkoutRequestId) {
      console.warn(
        `[mpesa] Callback for an unknown payment request: ${event.checkoutRequestId}`,
      )
      return response.status(200).json(SAFARICOM_ACKNOWLEDGEMENT)
    }

    if (order.status === 'paid') {
      return response.status(200).json(SAFARICOM_ACKNOWLEDGEMENT)
    }

    if (event.resultCode === 0) {
      if (event.amount == null) {
        console.error(
          `[mpesa] Successful callback for ${order.id} did not include an amount. Order was not marked paid.`,
        )

        updateOrder(order.id, (draft) => {
          draft.payment.message =
            'M-Pesa did not provide a payment amount. Please contact support.'
        })

        return response.status(200).json(SAFARICOM_ACKNOWLEDGEMENT)
      }

      if (Number(event.amount) !== Number(order.total)) {
        console.error(
          `[mpesa] Amount mismatch for ${order.id}: received ${event.amount}, expected ${order.total}. Order was not marked paid.`,
        )

        updateOrder(order.id, (draft) => {
          draft.payment.message =
            'M-Pesa confirmed a different amount. Please contact support.'
        })

        return response.status(200).json(SAFARICOM_ACKNOWLEDGEMENT)
      }

      const paidOrder = await markOrderPaid(order.id, {
        receiptNumber: event.mpesaReceiptNumber,
        phoneNumber: event.phoneNumber,
        paidAt: new Date().toISOString(),
      })

      console.log(
        `[mpesa] Payment confirmed for ${order.id}${
          event.mpesaReceiptNumber ? ` (${event.mpesaReceiptNumber})` : ''
        }${paidOrder?.status === 'paid' ? '' : ' — order could not be updated'}`,
      )
    } else {
      updateOrder(order.id, (draft) => {
        draft.status = 'payment_failed'
        draft.payment.status = 'failed'
        draft.payment.message = event.resultDesc
        draft.payment.resultCode = event.resultCode
      })

      console.log(
        `[mpesa] Payment not completed for ${order.id}: ${event.resultCode} ${event.resultDesc}`,
      )
    }
  } catch (error) {
    console.error('[mpesa] Callback handler failed:', error)
  }

  // Safaricom expects a 200 response, otherwise it retries the callback.
  return response.status(200).json(SAFARICOM_ACKNOWLEDGEMENT)
})

export default router
