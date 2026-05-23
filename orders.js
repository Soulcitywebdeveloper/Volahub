const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// POST create order
router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, deliveryAddress, items, paymentMethod, notes } = req.body;

    let totalAmount = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      enrichedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price
      });
      totalAmount += product.price * item.quantity;
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const order = new Order({
      customerName, customerEmail, customerPhone, deliveryAddress,
      items: enrichedItems, totalAmount, paymentMethod, notes
    });
    await order.save();
    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET all orders (admin)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('items.product', 'name imageUrl')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET dashboard stats
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const recentOrders = await Order.find().sort('-createdAt').limit(5);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        totalProducts,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
