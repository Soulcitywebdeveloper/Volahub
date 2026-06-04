const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Create order (customer)
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) return res.status(400).json({ success: false, message: `Product not available.` });
      if (product.stock.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });
      }
      const itemTotal = product.price.selling * item.quantity;
      subtotal += itemTotal;
      orderItems.push({ product: product._id, name: product.name, image: product.images[0]?.url, quantity: item.quantity, price: product.price.selling, total: itemTotal });
    }

    const shipping = subtotal > 50000 ? 0 : 1500;
    const tax = Math.round(subtotal * 0.075);
    const total = subtotal + shipping + tax;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      pricing: { subtotal, shipping, tax, total },
      shippingAddress,
      paymentMethod,
      notes,
      statusHistory: [{ status: 'pending', note: 'Order placed', updatedBy: req.user._id }]
    });

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'stock.quantity': -item.quantity, salesCount: item.quantity }
      });
    }

    const populated = await order.populate([{ path: 'user', select: 'name email' }, { path: 'items.product', select: 'name images' }]);
    res.status(201).json({ success: true, message: 'Order placed successfully!', data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get user orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt').populate('items.product', 'name images');
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all orders (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).populate('user', 'name email phone'),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, data: orders, pagination: { page: Number(page), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status (admin)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled') order.cancelledAt = new Date();
    order.statusHistory.push({ status, note, updatedBy: req.user._id });

    await order.save();
    res.json({ success: true, message: `Order ${status}!`, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
