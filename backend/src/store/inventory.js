import { config } from '../config.js'
import { catalog, findProduct, findSize, stockKey } from '../catalog.js'
import { InventoryItem } from '../models/inventoryItem.js'

function toStockMap(documents) {
  return documents.reduce((map, document) => {
    map[document.key] = document.stock
    return map
  }, {})
}

async function loadStockDocuments() {
  return InventoryItem.find({}).select({ _id: 0, __v: 0 }).lean()
}

// Called once at startup. Every product/size in the shared catalog gets a row;
// existing rows are never overwritten, so live stock survives restarts.
export async function ensureCatalogStock() {
  if (catalog.length === 0) return

  const operations = []

  for (const product of catalog) {
    for (const size of product.sizes) {
      operations.push({
        updateOne: {
          filter: { key: stockKey(product.id, size) },
          update: {
            $setOnInsert: {
              productId: product.id,
              size,
              stock: Number(product.defaultStock) || 0,
            },
          },
          upsert: true,
        },
      })
    }
  }

  const result = await InventoryItem.bulkWrite(operations, { ordered: false })
  const initialised = Number(result.upsertedCount) || 0

  if (initialised > 0) {
    console.log(`[inventory] Initialised ${initialised} variant stock level(s).`)
  } else {
    console.log(
      `[inventory] ${Object.keys(toStockMap(await loadStockDocuments())).length} variant stock level(s) ready.`,
    )
  }
}

export async function getStock(productId, size) {
  const document = await InventoryItem.findOne({
    key: stockKey(productId, size),
  })
    .select({ stock: 1, _id: 0 })
    .lean()

  return document?.stock ?? 0
}

export async function getStockMap() {
  return toStockMap(await loadStockDocuments())
}

export async function getLowStockVariants() {
  const stock = toStockMap(await loadStockDocuments())
  const low = []

  for (const product of catalog) {
    for (const size of product.sizes) {
      const quantity = stock[stockKey(product.id, size)] ?? 0

      if (quantity <= config.inventory.lowStockThreshold) {
        low.push({
          productId: product.id,
          name: product.name,
          size,
          stock: quantity,
        })
      }
    }
  }

  return low
}

export async function getInventorySnapshot() {
  const stock = toStockMap(await loadStockDocuments())

  return catalog.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    image: product.image,
    sizes: product.sizes.map((size) => {
      const quantity = stock[stockKey(product.id, size)] ?? 0

      return {
        size,
        stock: quantity,
        lowStock: quantity <= config.inventory.lowStockThreshold,
      }
    }),
  }))
}

export async function setStock(productId, size, quantity) {
  const product = findProduct(productId)

  if (!product || !findSize(product, size)) {
    return { ok: false, error: 'Unknown product or size.' }
  }

  const nextQuantity = Number(quantity)

  if (
    !Number.isInteger(nextQuantity) ||
    nextQuantity < 0 ||
    nextQuantity > 100000
  ) {
    return { ok: false, error: 'Stock must be a whole number from 0 to 100000.' }
  }

  await InventoryItem.updateOne(
    { key: stockKey(product.id, size) },
    {
      $set: { stock: nextQuantity, productId: product.id, size },
      $setOnInsert: { key: stockKey(product.id, size) },
    },
    { upsert: true },
  )

  return {
    ok: true,
    productId: product.id,
    size,
    stock: nextQuantity,
  }
}

// Debits stock once a payment has been confirmed. Stock is checked when the
// order is created; if two orders race for the last item we clamp at zero and
// log the shortfall rather than failing a payment the customer already made.
export async function decrementStock(items) {
  const requested = new Map()

  for (const item of items ?? []) {
    const key = stockKey(item.productId, item.size)
    requested.set(key, (requested.get(key) ?? 0) + (Number(item.qty) || 0))
  }

  if (requested.size === 0) return { changes: {}, shortfalls: [] }

  const documents = await InventoryItem.find({
    key: { $in: [...requested.keys()] },
  })
    .select({ key: 1, stock: 1, _id: 0 })
    .lean()

  const currentStock = new Map(
    documents.map((document) => [document.key, document.stock]),
  )
  const changes = {}
  const shortfalls = []
  const operations = []

  for (const [key, quantity] of requested) {
    const current = currentStock.get(key) ?? 0
    const next = Math.max(0, current - quantity)

    if (quantity > current) {
      shortfalls.push({
        productId: key.split('::')[0],
        size: key.split('::').slice(1).join('::'),
        requested: quantity,
        available: current,
      })
    }

    changes[key] = next
    operations.push({
      updateOne: {
        filter: { key },
        update: { $set: { stock: next } },
        upsert: true,
      },
    })
  }

  await InventoryItem.bulkWrite(operations, { ordered: false })

  if (shortfalls.length > 0) {
    console.warn(
      '[inventory] Stock shortfall after payment:',
      JSON.stringify(shortfalls),
    )
  }

  return { changes, shortfalls }
}
