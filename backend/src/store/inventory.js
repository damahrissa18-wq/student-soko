import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { catalog, findProduct, findSize, stockKey } from '../catalog.js'

const stock = new Map()

loadInventory()
ensureCatalogStock()

function loadInventory() {
  try {
    const raw = fs.readFileSync(config.inventoryFile, 'utf8')
    const saved = JSON.parse(raw)

    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return

    for (const [key, value] of Object.entries(saved)) {
      const quantity = Number(value)
      if (Number.isInteger(quantity) && quantity >= 0) {
        stock.set(key, quantity)
      }
    }

    console.log(
      `[inventory] Loaded ${stock.size} variant stock level(s) from ${config.inventoryFile}`,
    )
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[inventory] Could not read saved stock:', error.message)
    }
  }
}

function persistInventory() {
  try {
    fs.mkdirSync(path.dirname(config.inventoryFile), { recursive: true })
    const temporaryFile = `${config.inventoryFile}.tmp`
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(Object.fromEntries(stock), null, 2),
      'utf8',
    )
    fs.renameSync(temporaryFile, config.inventoryFile)
  } catch (error) {
    console.error('[inventory] Could not save stock:', error.message)
  }
}

function ensureCatalogStock() {
  let added = 0

  for (const product of catalog) {
    for (const size of product.sizes) {
      const key = stockKey(product.id, size)
      if (!stock.has(key)) {
        stock.set(key, Number(product.defaultStock) || 0)
        added += 1
      }
    }
  }

  if (added > 0) {
    persistInventory()
    console.log(`[inventory] Initialised ${added} new variant stock level(s).`)
  }
}

export function getStock(productId, size) {
  return stock.get(stockKey(productId, size)) ?? 0
}

export function getStockMap() {
  return Object.fromEntries(stock)
}

export function getLowStockVariants() {
  const low = []

  for (const product of catalog) {
    for (const size of product.sizes) {
      const quantity = getStock(product.id, size)
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

export function getInventorySnapshot() {
  return catalog.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    image: product.image,
    sizes: product.sizes.map((size) => ({
      size,
      stock: getStock(product.id, size),
      lowStock: getStock(product.id, size) <= config.inventory.lowStockThreshold,
    })),
  }))
}

export function setStock(productId, size, quantity) {
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

  stock.set(stockKey(product.id, size), nextQuantity)
  persistInventory()

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
export function decrementStock(items) {
  const changes = new Map()
  const shortfalls = []

  for (const item of items ?? []) {
    const key = stockKey(item.productId, item.size)
    const current = changes.get(key) ?? getStock(item.productId, item.size)
    const requested = Number(item.qty) || 0
    const next = Math.max(0, current - requested)

    if (requested > current) {
      shortfalls.push({
        productId: item.productId,
        size: item.size,
        requested,
        available: current,
      })
    }

    changes.set(key, next)
  }

  for (const [key, quantity] of changes) {
    stock.set(key, quantity)
  }

  persistInventory()

  if (shortfalls.length > 0) {
    console.warn(
      '[inventory] Stock shortfall after payment:',
      JSON.stringify(shortfalls),
    )
  }

  return { changes: Object.fromEntries(changes), shortfalls }
}
