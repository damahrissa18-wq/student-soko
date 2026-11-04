import mongoose from 'mongoose'
import {
  connectToDatabase,
  describeDatabase,
  disconnectFromDatabase,
} from '../src/db.js'
import { Order } from '../src/models/order.js'
import { InventoryItem } from '../src/models/inventoryItem.js'
import { Subscriber } from '../src/models/subscriber.js'

const PROBE = 'studentsoko_connection_check'

try {
  await connectToDatabase()

  const ping = await mongoose.connection.db.admin().command({ ping: 1 })
  console.log('PING OK:', JSON.stringify(ping))
  console.log('Connected to:', describeDatabase())

  const collections = await mongoose.connection.db.listCollections().toArray()
  console.log(
    'Collections:',
    collections.length
      ? collections.map((item) => item.name).join(', ')
      : '(none yet)',
  )

  await Promise.all([Order.init(), InventoryItem.init(), Subscriber.init()])

  const [orders, variants, subscribers] = await Promise.all([
    Order.estimatedDocumentCount(),
    InventoryItem.estimatedDocumentCount(),
    Subscriber.estimatedDocumentCount(),
  ])
  console.log(
    `Documents: ${orders} order(s), ${variants} inventory row(s), ${subscribers} subscriber(s)`,
  )

  const orderIndexes = await Order.collection.indexes()
  console.log(
    'Order indexes:',
    orderIndexes.map((index) => index.name).join(', '),
  )

  // Verify the cluster user can actually write, then clean the probe up.
  const probe = mongoose.connection.db.collection(PROBE)
  await probe.insertOne({ checkedAt: new Date(), note: PROBE })
  const probeReadBack = await probe.findOne({ note: PROBE })
  await probe.deleteMany({ note: PROBE })
  await probe.drop().catch(() => {})
  console.log(`Read/write probe: OK (${Boolean(probeReadBack)})`)

  await disconnectFromDatabase()
  console.log('All database checks passed.')
  process.exit(0)
} catch (error) {
  console.error('DATABASE CHECK FAILED:', error.message)
  process.exit(1)
}
