const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalRevenue, monthRevenue, totalOrders, pendingOrders, totalProducts, lowStockProducts, totalCustomers, recentOrders, topProducts] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] } }),
      User.countDocuments({ role: 'customer' }),
      Order.find().sort('-createdAt').limit(5).populate('user', 'name email'),
      Product.find({ isActive: true }).sort('-salesCount').limit(5).select('name price salesCount images stock')
    ]);

    res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: monthRevenue[0]?.total || 0
        },
        orders: { total: totalOrders, pending: pendingOrders },
        products: { total: totalProducts, lowStock: lowStockProducts },
        customers: { total: totalCustomers },
        recentOrders,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sales chart data (last 7 days)
router.get('/sales-chart', protect, adminOnly, async (req, res) => {
  try {
    const days = 7;
    const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0,0,0,0);

    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
