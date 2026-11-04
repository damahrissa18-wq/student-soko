import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import {
  connectToDatabase,
  describeDatabase,
  disconnectFromDatabase,
  isDatabaseConnected,
} from './db.js'
import adminRouter from './routes/admin.js'
import catalogRouter from './routes/catalog.js'
import mpesaRouter from './routes/mpesa.js'
import newsletterRouter from './routes/newsletter.js'
import ordersRouter from './routes/orders.js'
import {
  startAbandonedCartSweeper,
  stopAbandonedCartSweeper,
} from './services/abandonedCarts.js'
import { ensureCatalogStock } from './store/inventory.js'
import { Order } from './models/order.js'
import { InventoryItem } from './models/inventoryItem.js'
import { Subscriber } from './models/subscriber.js'

const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: config.corsOrigins }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    databaseName: config.mongo.dbName,
    emailMode: config.email.mode,
    mpesaMode: config.mpesa.mock ? 'mock' : config.mpesa.environment,
    adminConfigured: Boolean(config.admin.token),
    abandonedCart: config.abandonedCart.enabled,
  })
})

app.use('/api/catalog', catalogRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/mpesa', mpesaRouter)
app.use('/api/newsletter', newsletterRouter)
app.use('/api/admin', adminRouter)

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found.' })
})

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Invalid JSON body.' })
  }

  if (Number(error.statusCode) >= 400 && Number(error.statusCode) < 500) {
    return response.status(error.statusCode).json({
      error: error.expose ? error.message : 'Bad request.',
    })
  }

  console.error('[api] Unhandled error:', error)
  return response
    .status(500)
    .json({ error: 'Something went wrong. Please try again.' })
})

function printBanner() {
  console.log('')
  console.log(`StudentsSoko API listening on http://localhost:${config.port}`)
  console.log(`  Database: ${describeDatabase()}`)
  console.log(
    `  Email:  ${
      config.email.mode === 'resend'
        ? 'Resend'
        : 'console log (set RESEND_API_KEY to send real emails)'
    }`,
  )
  console.log(
    `  M-Pesa: ${
      config.mpesa.mock
        ? 'mock mode (payments auto-confirm after ~5s)'
        : `Daraja ${config.mpesa.environment}`
    }`,
  )
  console.log(
    `  Admin:  ${
      config.admin.token
        ? config.admin.configured
          ? 'ADMIN_TOKEN configured'
          : 'development fallback token "dev-admin-token"'
        : 'disabled (set ADMIN_TOKEN before production)'
    }`,
  )
  console.log(
    `  Site:   ${config.siteUrl} (used in email links; set SITE_URL in production)`,
  )
  console.log('')
}

async function start() {
  try {
    await connectToDatabase()
    await Promise.all([Order.init(), InventoryItem.init(), Subscriber.init()])
    await ensureCatalogStock()
  } catch (error) {
    console.error('[startup] Could not start the API:', error.message)
    process.exitCode = 1
    return
  }

  const server = app.listen(config.port, printBanner)
  startAbandonedCartSweeper()

  let shuttingDown = false

  async function shutdown(signal) {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[api] ${signal} received, shutting down...`)

    stopAbandonedCartSweeper()

    const forceExit = setTimeout(() => process.exit(1), 10_000)
    forceExit.unref()

    server.close(async () => {
      try {
        await disconnectFromDatabase()
      } finally {
        process.exit(0)
      }
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start()
