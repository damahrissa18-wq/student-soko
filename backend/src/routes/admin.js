import crypto from 'node:crypto'
import { Router } from 'express'
import { config } from '../config.js'
import {
  getAllOrders,
  getOrderById,
  toAdminOrder,
  updateOrder,
} from '../store/orders.js'
import {
  getInventorySnapshot,
  getLowStockVariants,
  setStock,
} from '../store/inventory.js'
import {
  countActiveSubscribers,
  listSubscribers,
} from '../store/subscribers.js'
import { sendShippedEmail } from '../services/orderEmails.js'

const router = Router()
const FULFILLMENT_STATUSES = [
  'unfulfilled',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

function tokensMatch(expected, received) {
  if (!expected || !received) return false

  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(String(received))

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

router.use((request, response, next) => {
  if (!config.admin.token) {
    return response.status(503).json({
      error:
        'Admin access is not configured. Set ADMIN_TOKEN in the backend environment.',
    })
  }

  const header = request.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  if (!tokensMatch(config.admin.token, token)) {
    return response.status(401).json({ error: 'Invalid admin token.' })
  }

  return next()
})

router.get('/ping', (_request, response) => {
  response.json({ ok: true })
})

router.get('/overview', async (_request, response) => {
  const orders = await getAllOrders()
  const lowStock = await getLowStockVariants()
  const paidOrders = orders.filter((order) => order.status === 'paid')
  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  )

  response.json({
    stats: {
      orders: orders.length,
      paidOrders: paidOrders.length,
      paidRevenue: revenue,
      pendingPayments: orders.filter((order) =>
        ['pending_payment', 'payment_failed'].includes(order.status),
      ).length,
      unfulfilled: orders.filter(
        (order) =>
          order.status === 'paid' &&
          ['unfulfilled', 'processing'].includes(order.fulfillmentStatus),
      ).length,
      subscribers: await countActiveSubscribers(),
      lowStock: lowStock.length,
    },
    lowStock: lowStock.slice(0, 12),
  })
})

router.get('/orders', async (request, response) => {
  const status = String(request.query.status ?? '').trim()
  const fulfillment = String(request.query.fulfillment ?? '').trim()
  const query = String(request.query.q ?? '').trim().toLowerCase()

  let orders = await getAllOrders()

  if (status) {
    orders = orders.filter((order) => order.status === status)
  }

  if (fulfillment) {
    orders = orders.filter(
      (order) => order.fulfillmentStatus === fulfillment,
    )
  }

  if (query) {
    orders = orders.filter((order) =>
      [
        order.id,
        order.customer?.name,
        order.customer?.email,
        order.customer?.phone,
        order.customer?.address,
        order.trackingNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }

  response.json({
    orders: orders.slice(0, 250).map(toAdminOrder),
    total: orders.length,
  })
})

router.patch('/orders/:id', async (request, response) => {
  const order = await getOrderById(request.params.id)
  if (!order) {
    return response.status(404).json({ error: 'Order not found.' })
  }

  const fulfillmentStatus = request.body?.fulfillmentStatus
  const trackingNumber = request.body?.trackingNumber

  if (
    fulfillmentStatus != null &&
    !FULFILLMENT_STATUSES.includes(fulfillmentStatus)
  ) {
    return response.status(400).json({ error: 'Unknown fulfilment status.' })
  }

  if (
    trackingNumber != null &&
    (typeof trackingNumber !== 'string' || trackingNumber.trim().length > 80)
  ) {
    return response.status(400).json({
      error: 'Tracking number must be 80 characters or fewer.',
    })
  }

  const previousStatus = order.fulfillmentStatus
  const nextStatus = fulfillmentStatus ?? previousStatus
  const nextTracking =
    trackingNumber === undefined
      ? order.trackingNumber
      : trackingNumber.trim() || null

  if (nextStatus === previousStatus && nextTracking === order.trackingNumber) {
    return response.json({ order: toAdminOrder(order), email: null })
  }

  const updated = await updateOrder(order.id, (draft) => {
    draft.fulfillmentStatus = nextStatus
    draft.trackingNumber = nextTracking
    draft.fulfillmentUpdatedAt = new Date().toISOString()
  })

  let email = null

  if (
    nextStatus === 'shipped' &&
    previousStatus !== 'shipped' &&
    updated.status === 'paid' &&
    !updated.emails?.shippedEmailSentAt
  ) {
    const result = await sendShippedEmail(updated).catch((error) => ({
      status: 'failed',
      error: error.message,
    }))
    email = {
      status: result.status,
      message:
        result.status === 'sent'
          ? 'Shipping email sent.'
          : result.status === 'logged'
            ? 'Demo mode: shipping email logged to the server console.'
            : 'Order updated, but the shipping email could not be sent.',
    }
  }

  return response.json({
    order: toAdminOrder(await getOrderById(order.id)),
    email,
  })
})

router.get('/inventory', async (_request, response) => {
  response.json({
    inventory: await getInventorySnapshot(),
    lowStockThreshold: config.inventory.lowStockThreshold,
  })
})

router.patch('/inventory', async (request, response) => {
  const { productId, size, stock } = request.body ?? {}
  const result = await setStock(productId, size, stock)

  if (!result.ok) {
    return response.status(400).json({ error: result.error })
  }

  return response.json({
    item: result,
    inventory: await getInventorySnapshot(),
  })
})

router.get('/subscribers', async (_request, response) => {
  response.json({
    subscribers: await listSubscribers(),
    active: await countActiveSubscribers(),
  })
})

export default router
