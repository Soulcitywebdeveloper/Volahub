const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String, trim: true },
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, default: 'VolaHub' },
  images: [{ url: String, alt: String, isPrimary: Boolean }],
  price: {
    original: { type: Number, required: true, min: 0 },
    selling: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    discountPercent: { type: Number, default: 0 }
  },
  stock: {
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, default: 'piece' },
    lowStockThreshold: { type: Number, default: 10 },
    trackStock: { type: Boolean, default: true }
  },
  weight: { value: Number, unit: { type: String, default: 'kg' } },
  dimensions: { length: Number, width: Number, height: Number, unit: { type: String, default: 'cm' } },
  tags: [String],
  features: [String],
  nutritionInfo: {
    calories: Number,
    servingSize: String,
    ingredients: String
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  salesCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  priceHistory: [{
    price: Number,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ 'price.selling': 1 });

productSchema.virtual('isInStock').get(function() {
  return this.stock.quantity > 0;
});

productSchema.virtual('isLowStock').get(function() {
  return this.stock.quantity <= this.stock.lowStockThreshold && this.stock.quantity > 0;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
