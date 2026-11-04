import mongoose from 'mongoose'
import { config } from './config.js'

function safeConnectionString() {
  const uri = String(config.mongo.uri ?? '').trim()
  if (!uri) return '(not set)'
  return uri.replace(/\/\/([^@]*)@/, '//***:***@')
}

export function describeDatabase() {
  const connection = mongoose.connection
  if (!connection?.name) return '(not connected)'
  return `${connection.host ?? 'unknown host'}/${connection.name}`
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}

function buildConnectionString() {
  let uri = String(config.mongo.uri ?? '').trim()

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to backend/.env before starting the API.',
    )
  }

  // Allow MONGODB_USERNAME/MONGODB_PASSWORD to fill in a credential-less URI.
  const hasCredentials = /\/\/[^/@]+@/.test(uri)
  const hasPlaceholder = /[<{]/.test(uri)

  if (!hasCredentials && !hasPlaceholder && config.mongo.username) {
    const user = encodeURIComponent(config.mongo.username)
    const password = encodeURIComponent(config.mongo.password)
    uri = uri.replace('://', `://${user}:${password}@`)
  }

  return uri
}

let connectionPromise = null

export async function connectToDatabase() {
  if (isDatabaseConnected()) return mongoose.connection

  if (connectionPromise) return connectionPromise

  connectionPromise = (async () => {
    mongoose.set('strictQuery', true)
    mongoose.connection.on('error', (error) => {
      console.error('[db] MongoDB connection error:', error.message)
    })
    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected.')
    })
    mongoose.connection.on('reconnected', () => {
      console.log('[db] MongoDB reconnected.')
    })

    console.log(`[db] Connecting to ${safeConnectionString()} ...`)

    await mongoose.connect(buildConnectionString(), {
      dbName: config.mongo.dbName,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    })

    console.log(`[db] Connected to ${describeDatabase()}`)
    return mongoose.connection
  })()

  try {
    return await connectionPromise
  } catch (error) {
    connectionPromise = null
    throw new Error(`Could not connect to MongoDB: ${error.message}`)
  }
}

export async function disconnectFromDatabase() {
  connectionPromise = null
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
