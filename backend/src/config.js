import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const readText = (value) => (value ?? '').trim()

const readInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const readBoolean = (value) => readText(value).toLowerCase() === 'true'

const readBooleanWithDefault = (value, fallback) =>
  readText(value) === '' ? fallback : readBoolean(value)

const resendApiKey = readText(process.env.RESEND_API_KEY)
const requestedEmailMode = readText(process.env.EMAIL_MODE).toLowerCase()
const nodeEnv = readText(process.env.NODE_ENV) || 'development'
const configuredAdminToken = readText(process.env.ADMIN_TOKEN)
const adminToken =
  configuredAdminToken || (nodeEnv === 'production' ? '' : 'dev-admin-token')

const mpesa = {
  environment:
    readText(process.env.MPESA_ENV).toLowerCase() === 'production'
      ? 'production'
      : 'sandbox',
  consumerKey: readText(process.env.MPESA_CONSUMER_KEY),
  consumerSecret: readText(process.env.MPESA_CONSUMER_SECRET),
  shortcode: readText(process.env.MPESA_SHORTCODE) || '174379',
  passkey: readText(process.env.MPESA_PASSKEY),
  transactionType:
    readText(process.env.MPESA_TRANSACTION_TYPE) || 'CustomerPayBillOnline',
  callbackUrl: readText(process.env.MPESA_CALLBACK_URL),
}

const mpesaConfigured = Boolean(
  mpesa.consumerKey &&
    mpesa.consumerSecret &&
    mpesa.shortcode &&
    mpesa.passkey &&
    mpesa.callbackUrl,
)

export const config = {
  port: readInt(process.env.PORT, 4000),
  nodeEnv,
  siteUrl: (readText(process.env.SITE_URL) || 'http://localhost:5173').replace(
    /\/$/,
    '',
  ),
  corsOrigins: (readText(process.env.CORS_ORIGIN) ||
    'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  admin: {
    token: adminToken,
    configured: Boolean(configuredAdminToken),
  },
  delivery: {
    freeAt: readInt(process.env.FREE_DELIVERY_AT, 2000),
    fee: readInt(process.env.DELIVERY_FEE, 150),
  },
  inventory: {
    lowStockThreshold: readInt(process.env.LOW_STOCK_THRESHOLD, 3),
  },
  abandonedCart: {
    enabled: readBooleanWithDefault(process.env.ABANDONED_CART_ENABLED, true),
    delayMinutes: readInt(process.env.ABANDONED_CART_DELAY_MINUTES, 60),
    sweepMinutes: readInt(process.env.ABANDONED_CART_SWEEP_MINUTES, 15),
    maxAgeDays: readInt(process.env.ABANDONED_CART_MAX_AGE_DAYS, 7),
  },
  email: {
    apiKey: resendApiKey,
    from:
      readText(process.env.RESEND_FROM_EMAIL) ||
      'StudentsSoko <onboarding@resend.dev>',
    replyTo: readText(process.env.RESEND_REPLY_TO) || null,
    mode: resendApiKey && requestedEmailMode !== 'log' ? 'resend' : 'log',
  },
  mpesa: {
    ...mpesa,
    configured: mpesaConfigured,
    mock: readBoolean(process.env.MPESA_MOCK) || !mpesaConfigured,
  },
  storeFile: process.env.ORDER_STORE_FILE
    ? path.resolve(process.env.ORDER_STORE_FILE)
    : path.join(backendDir, 'data', 'orders.json'),
  inventoryFile: process.env.INVENTORY_STORE_FILE
    ? path.resolve(process.env.INVENTORY_STORE_FILE)
    : path.join(backendDir, 'data', 'inventory.json'),
  subscriberFile: process.env.SUBSCRIBER_STORE_FILE
    ? path.resolve(process.env.SUBSCRIBER_STORE_FILE)
    : path.join(backendDir, 'data', 'subscribers.json'),
}
