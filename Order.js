const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'Nigeria' }
    }
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    sku: String,
    price: Number,
    quantity: Number,
    subtotal: Number
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, default: 'card' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
