import mongoose from 'mongoose'

const { Schema } = mongoose

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    variantKey: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: String, required: true },
    color: {
      name: { type: String, required: true },
      hex: { type: String, default: '' },
    },
    unitPrice: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    token: { type: String, required: true, unique: true, sparse: true },
    status: { type: String, default: 'pending_payment' },
    fulfillmentStatus: {
      type: String,
      enum: [
        'unfulfilled',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'unfulfilled',
    },
    trackingNumber: { type: String, default: null },
    fulfillmentUpdatedAt: { type: Date, default: null },
    stockAdjustedAt: { type: Date, default: null },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: {
      method: { type: String, default: 'mpesa' },
      status: { type: String, default: 'pending' },
      mode: { type: String, default: null },
      checkoutRequestId: { type: String, default: null, index: true },
      merchantRequestId: { type: String, default: null },
      receiptNumber: { type: String, default: null },
      paidAt: { type: Date, default: null },
      phoneNumber: { type: String, default: null },
      message: { type: String, default: null },
      resultCode: { type: Number, default: null },
    },
    emails: {
      orderConfirmationSentAt: { type: Date, default: null },
      paymentReceiptSentAt: { type: Date, default: null },
      abandonedCartSentAt: { type: Date, default: null },
      shippedEmailSentAt: { type: Date, default: null },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'orders',
    timestamps: false,
    optimisticConcurrency: true,
  },
)

orderSchema.index({ createdAt: -1 })
orderSchema.index({ status: 1, fulfillmentStatus: 1 })

export const Order = mongoose.models.Order ?? mongoose.model('Order', orderSchema)
