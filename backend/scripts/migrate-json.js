import crypto from 'node:crypto'
import fs from 'node:fs'
import {
  connectToDatabase,
  describeDatabase,
  disconnectFromDatabase,
} from '../src/db.js'
import { config } from '../src/config.js'
import { Order } from '../src/models/order.js'
import { InventoryItem } from '../src/models/inventoryItem.js'
import { Subscriber } from '../src/models/subscriber.js'
import { ensureCatalogStock } from '../src/store/inventory.js'

const FORCE = process.argv.includes('--force')

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw new Error(`Could not read ${filePath}: ${error.message}`)
  }
}

function normaliseOrder(order) {
  return {
    ...order,
    token: order.token ?? crypto.randomBytes(32).toString('base64url'),
    fulfillmentStatus: order.fulfillmentStatus ?? 'unfulfilled',
    trackingNumber: order.trackingNumber ?? null,
    fulfillmentUpdatedAt: order.fulfillmentUpdatedAt ?? null,
    stockAdjustedAt: order.stockAdjustedAt ?? null,
    payment: {
      method: 'mpesa',
      status: 'pending',
      mode: null,
      checkoutRequestId: null,
      merchantRequestId: null,
      receiptNumber: null,
      paidAt: null,
      phoneNumber: order.customer?.phone ?? null,
      message: null,
      ...(order.payment ?? {}),
    },
    emails: {
      orderConfirmationSentAt: null,
      paymentReceiptSentAt: null,
      abandonedCartSentAt: null,
      shippedEmailSentAt: null,
      ...(order.emails ?? {}),
    },
  }
}

async function migrateOrders() {
  const saved = readJsonFile(config.storeFile)
  if (!Array.isArray(saved) || saved.length === 0) {
    console.log('[migrate] No orders JSON found; skipping orders.')
    return
  }

  let upserted = 0
  let skipped = 0

  for (const order of saved) {
    if (!order?.id) {
      skipped += 1
      continue
    }

    const update = FORCE
      ? { $set: normaliseOrder(order) }
      : { $setOnInsert: normaliseOrder(order) }

    const result = await Order.updateOne({ id: order.id }, update, {
      upsert: true,
    })

    if (result.upsertedCount > 0 || (FORCE && result.matchedCount > 0)) {
      upserted += 1
    } else {
      skipped += 1
    }
  }

  console.log(
    `[migrate] Orders: ${upserted} imported, ${skipped} already present/skipped.`,
  )
}

async function migrateInventory() {
  const saved = readJsonFile(config.inventoryFile)
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    console.log('[migrate] No inventory JSON found; skipping stock import.')
    return
  }

  let imported = 0
  let skipped = 0
  const operations = []

  for (const [key, value] of Object.entries(saved)) {
    const quantity = Number(value)

    if (!Number.isInteger(quantity) || quantity < 0) {
      skipped += 1
      continue
    }

    const [productId, ...sizeParts] = key.split('::')
    const size = sizeParts.join('::')

    if (!productId || !size) {
      skipped += 1
      continue
    }

    operations.push({
      updateOne: {
        filter: { key },
        update: FORCE
          ? {
              $set: { productId, size, stock: quantity },
              $setOnInsert: { key },
            }
          : {
              $setOnInsert: { key, productId, size, stock: quantity },
            },
        upsert: true,
      },
    })
    imported += 1
  }

  if (operations.length > 0) {
    await InventoryItem.bulkWrite(operations, { ordered: false })
  }

  console.log(
    `[migrate] Inventory: ${imported} variant level(s) processed, ${skipped} skipped.`,
  )
}

async function migrateSubscribers() {
  const saved = readJsonFile(config.subscriberFile)
  if (!Array.isArray(saved) || saved.length === 0) {
    console.log('[migrate] No subscribers JSON found; skipping subscribers.')
    return
  }

  let imported = 0
  let skipped = 0

  for (const subscriber of saved) {
    const email = String(subscriber?.email ?? '')
      .trim()
      .toLowerCase()

    if (!email) {
      skipped += 1
      continue
    }

    const now = new Date().toISOString()
    const document = {
      id:
        subscriber.id ??
        `SUB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
      email,
      name: subscriber.name ?? null,
      source: subscriber.source ?? 'drop-signup',
      status: subscriber.status === 'unsubscribed' ? 'unsubscribed' : 'subscribed',
      token: subscriber.token ?? crypto.randomBytes(24).toString('base64url'),
      subscribedAt: subscriber.subscribedAt ?? now,
      unsubscribedAt: subscriber.unsubscribedAt ?? null,
      welcomeEmailSentAt: subscriber.welcomeEmailSentAt ?? null,
    }

    const result = await Subscriber.updateOne(
      { email },
      FORCE ? { $set: document } : { $setOnInsert: document },
      { upsert: true },
    )

    if (result.upsertedCount > 0 || (FORCE && result.matchedCount > 0)) {
      imported += 1
    } else {
      skipped += 1
    }
  }

  console.log(
    `[migrate] Subscribers: ${imported} imported, ${skipped} already present/skipped.`,
  )
}

try {
  await connectToDatabase()
  await Promise.all([Order.init(), InventoryItem.init(), Subscriber.init()])

  console.log(`[migrate] Target database: ${describeDatabase()}`)
  console.log(
    `[migrate] Mode: ${FORCE ? 'overwrite existing documents' : 'insert only (safe)'}`,
  )

  await migrateOrders()
  await migrateInventory()
  await migrateSubscribers()

  // Seed any catalog variants that did not exist in the JSON file.
  await ensureCatalogStock()

  console.log('[migrate] Done.')
  await disconnectFromDatabase()
  process.exit(0)
} catch (error) {
  console.error('[migrate] Failed:', error.message)
  process.exit(1)
}
