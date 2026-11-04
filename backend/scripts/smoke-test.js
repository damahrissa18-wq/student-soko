// End-to-end API smoke test. Uses mock payments (no real money) and cleans up
// every document it creates. Run the API first, then: npm run test:smoke
import {
  connectToDatabase,
  disconnectFromDatabase,
} from '../src/db.js'
import { config } from '../src/config.js'
import { getStock, setStock } from '../src/store/inventory.js'
import { Order } from '../src/models/order.js'
import { Subscriber } from '../src/models/subscriber.js'

const BASE_URL = process.env.SMOKE_BASE_URL || `http://localhost:${config.port}`
const ADMIN_TOKEN = config.admin.token
const stamp = Date.now()
const testEmail = `smoke+${stamp}@studentsoko.test`

async function api(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const body = await response.json().catch(() => null)
  return { status: response.status, body }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
  console.log(`  ok - ${message}`)
}

let orderId = null
let originalStock = null
let stockTarget = null

try {
  await connectToDatabase()

  console.log(`Smoke testing ${BASE_URL}`)

  const health = await api('/api/health')
  assert(health.status === 200, 'health endpoint responds')
  assert(health.body.database === 'connected', 'database reports connected')

  const catalogResponse = await api('/api/catalog')
  assert(catalogResponse.status === 200, 'catalog loads')
  const stockKeys = Object.keys(catalogResponse.body.stock ?? {})
  assert(stockKeys.length > 0, `catalog returns stock (${stockKeys.length} variants)`)

  const product = (catalogResponse.body.products ?? []).find((item) => {
    const size = item.sizes?.[0]
    return size && Number(catalogResponse.body.stock?.[`${item.id}::${size}`] ?? 0) > 0
  })
  assert(Boolean(product), 'found a product with stock to test checkout')

  const size = product.sizes[0]
  const color = product.colors[0].name
  originalStock = await getStock(product.id, size)
  stockTarget = { productId: product.id, size }

  const created = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer: {
        name: 'Smoke Test',
        email: testEmail,
        phone: '0712345678',
        address: 'Smoke Test Hostel, Room 1',
      },
      items: [{ id: product.id, size, color, qty: 1 }],
    }),
  })

  assert(created.status === 201, 'checkout creates an order in MongoDB')
  orderId = created.body?.order?.id
  const orderToken = created.body?.token
  assert(Boolean(orderId && orderToken), 'order id and private token are returned')

  const authorized = await api(`/api/orders/${orderId}`, {
    headers: { 'x-order-token': orderToken },
  })
  assert(authorized.status === 200, 'order can be read with its token')

  const lookup = await api('/api/orders/lookup', {
    method: 'POST',
    body: JSON.stringify({ orderId, email: testEmail }),
  })
  assert(lookup.status === 200, 'order lookup by number + email works')

  console.log('  waiting for mock payment to confirm...')
  await new Promise((resolve) => setTimeout(resolve, 7000))

  const paid = await api(`/api/orders/${orderId}`, {
    headers: { 'x-order-token': orderToken },
  })
  assert(paid.body?.order?.status === 'paid', 'mock payment marks the order paid')
  assert(
    String(paid.body?.order?.payment?.receiptNumber ?? '').startsWith('MOCK'),
    'payment receipt number is stored',
  )

  const debitedStock = await getStock(product.id, size)
  assert(
    debitedStock === originalStock - 1,
    `stock was decremented (${originalStock} -> ${debitedStock})`,
  )

  const overview = await api('/api/admin/overview', {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  })
  assert(overview.status === 200, 'admin overview works against MongoDB')

  const orders = await api('/api/admin/orders', {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  })
  assert(
    (orders.body?.orders ?? []).some((order) => order.id === orderId),
    'admin order list includes the new order',
  )

  const patchedOrder = await api(`/api/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify({ fulfillmentStatus: 'processing' }),
  })
  assert(
    patchedOrder.body?.order?.fulfillmentStatus === 'processing',
    'admin can update fulfilment status',
  )

  const inventory = await api('/api/admin/inventory', {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  })
  assert(
    (inventory.body?.inventory ?? []).length > 0,
    'admin inventory snapshot loads',
  )

  const stockPatch = await api('/api/admin/inventory', {
    method: 'PATCH',
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify({
      productId: product.id,
      size,
      stock: originalStock,
    }),
  })
  assert(
    stockPatch.status === 200 && stockPatch.body?.item?.stock === originalStock,
    'admin can set a stock level',
  )

  const subscribed = await api('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, source: 'smoke-test' }),
  })
  assert(subscribed.status === 201, 'newsletter subscription is stored')

  const subscriber = await Subscriber.findOne({ email: testEmail }).lean()
  assert(Boolean(subscriber?.token), 'subscriber token is stored')

  const unsubscribed = await api(
    `/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.token)}`,
  )
  assert(unsubscribed.status === 200, 'unsubscribe link works')

  const afterUnsubscribe = await Subscriber.findOne({ email: testEmail }).lean()
  assert(
    afterUnsubscribe?.status === 'unsubscribed',
    'subscriber status is persisted as unsubscribed',
  )

  console.log('Smoke test passed.')
} catch (error) {
  console.error('Smoke test failed:', error.message)
  process.exitCode = 1
} finally {
  if (orderId) {
    await Order.deleteOne({ id: orderId }).catch(() => {})
    console.log(`  cleaned up order ${orderId}`)
  }

  await Subscriber.deleteMany({ email: testEmail }).catch(() => {})
  console.log('  cleaned up test subscriber')

  if (stockTarget && originalStock != null) {
    await setStock(stockTarget.productId, stockTarget.size, originalStock).catch(
      () => {},
    )
    console.log('  restored test stock')
  }

  await disconnectFromDatabase()
  process.exit(process.exitCode ?? 0)
}
