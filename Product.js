const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['Food & Beverages', 'Personal Care', 'Home Care', 'Health & Wellness', 'Baby & Kids', 'Pet Care', 'Other']
  },
  brand: { type: String, required: true },
  sku: { type: String, unique: true, required: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  unit: { type: String, default: 'piece' },
  weight: { type: String },
  images: [{ type: String }],
  thumbnail: { type: String },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  priceHistory: [{
    price: Number,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String
  }]
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
