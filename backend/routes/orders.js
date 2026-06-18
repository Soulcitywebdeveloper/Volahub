const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { sendOrderConfirmation, sendOrderStatusUpdate, sendAdminNewOrderAlert } = require('../utils/emailService');

const router = express.Router();

// ─── IMPORTANT: specific routes MUST come before /:id ───────────────────────

// PUBLIC: Track order by order number + email (no login needed)
router.post('/track', async (req, res) => {
  try {
    const { orderNumber, email } = req.body;
    if (!orderNumber || !email) {
      return res.status(400).json({ success: false, message: 'Order number and email are required.' });
    }

    const order = await Order.findOne({ orderNumber })
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found. Please check your order number and try again.' });
    }

    // Verify email matches the order
    if (order.user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'The email address does not match this order.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AUTH: Get current user's orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name images');
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN: Get all orders with filters and pagination
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).populate('user', 'name email phone'),
      Order.countDocuments(query)
    ]);
    res.json({
      success: true,
      data: orders,
      pagination: { page: Number(page), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AUTH: Place a new order
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not available.` });
      }
      if (product.stock.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });
      }
      const itemTotal = product.price.selling * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url,
        quantity: item.quantity,
        price: product.price.selling,
        total: itemTotal
      });
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
      statusHistory: [{ status: 'pending', note: 'Order placed successfully', updatedBy: req.user._id }]
    });

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'stock.quantity': -item.quantity, salesCount: item.quantity }
      });
    }

    const populated = await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name images' }
    ]);

    // Send emails non-blocking — never delay the API response
    sendOrderConfirmation(order, req.user)
      .catch(e => console.error('Order confirmation email failed:', e.message));
    sendAdminNewOrderAlert(order, req.user)
      .catch(e => console.error('Admin alert email failed:', e.message));

    res.status(201).json({ success: true, message: 'Order placed successfully!', data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// AUTH: Get a single order by ID (customer can only see own orders)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (req.user.role === 'customer' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN: Update order status and send email notification
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    if (status === 'cancelled') order.cancelledAt = new Date();
    order.statusHistory.push({ status, note: note || '', updatedBy: req.user._id });

    await order.save();

    // Email customer about status change
    if (order.user?.email) {
      sendOrderStatusUpdate(order, order.user, status, note)
        .catch(e => console.error('Status update email failed:', e.message));
    }

    res.json({ success: true, message: `Order updated to "${status}"!`, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
