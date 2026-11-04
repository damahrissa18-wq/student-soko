import mongoose from 'mongoose'

const { Schema } = mongoose

const subscriberSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, default: null },
    source: { type: String, default: 'drop-signup' },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed'],
      default: 'subscribed',
      index: true,
    },
    token: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now, index: true },
    unsubscribedAt: { type: Date, default: null },
    welcomeEmailSentAt: { type: Date, default: null },
  },
  {
    collection: 'subscribers',
    timestamps: true,
    versionKey: false,
  },
)

subscriberSchema.index({ subscribedAt: -1 })

export const Subscriber =
  mongoose.models.Subscriber ??
  mongoose.model('Subscriber', subscriberSchema)
