import mongoose from 'mongoose'

const { Schema } = mongoose

const inventoryItemSchema = new Schema(
  {
    // `${productId}::${size}` — the same key the JSON store used.
    key: { type: String, required: true, unique: true },
    productId: { type: String, required: true, index: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  {
    collection: 'inventory',
    timestamps: true,
    versionKey: false,
  },
)

export const InventoryItem =
  mongoose.models.InventoryItem ??
  mongoose.model('InventoryItem', inventoryItemSchema)
