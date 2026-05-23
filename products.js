const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const { category, search, featured, sort, page = 1, limit = 12, minPrice, maxPrice } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all') query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
    const sortOptions = { 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, 'newest': { createdAt: -1 }, 'rating': { rating: -1 }, 'name': { name: 1 } };
    const sortBy = sortOptions[sort] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortBy).skip(skip).limit(Number(limit));
    res.json({ success: true, products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const active = await Product.countDocuments({ isActive: true });
    const lowStock = await Product.countDocuments({ stock: { $lt: 10 }, isActive: true });
    const categories = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ success: true, stats: { total, active, lowStock, categories } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, brand, sku, stock, unit, weight, tags, isFeatured } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const product = await Product.create({
      name, description, price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category, brand, sku, stock: Number(stock) || 0, unit, weight,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      images, thumbnail: images[0] || '',
      isFeatured: isFeatured === 'true',
      priceHistory: [{ price: Number(price), updatedBy: req.user.name }]
    });
    res.status(201).json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const updates = { ...req.body };
    if (updates.price && Number(updates.price) !== product.price) product.priceHistory.push({ price: Number(updates.price), updatedBy: req.user.name });
    if (updates.tags) updates.tags = updates.tags.split(',').map(t => t.trim());
    if (updates.price) updates.price = Number(updates.price);
    if (updates.stock) updates.stock = Number(updates.stock);
    if (updates.originalPrice) updates.originalPrice = Number(updates.originalPrice);
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      updates.images = newImages; updates.thumbnail = newImages[0];
    }
    Object.assign(product, updates);
    await product.save();
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id/price', protect, adminOnly, async (req, res) => {
  try {
    const { price } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.priceHistory.push({ price: Number(price), updatedBy: req.user.name });
    product.price = Number(price);
    await product.save();
    res.json({ success: true, product, message: 'Price updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
