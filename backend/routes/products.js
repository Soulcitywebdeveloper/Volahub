const express = require('express');
const path = require('path');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET all products (public) with filters, search, pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, sort = '-createdAt', minPrice, maxPrice, featured, newArrival } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (newArrival === 'true') query.isNewArrival = true;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query['price.selling'] = {};
      if (minPrice) query['price.selling'].$gte = Number(minPrice);
      if (maxPrice) query['price.selling'].$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug').populate('createdBy', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create product with image upload (admin)
router.post('/', protect, adminOnly, upload.array('productImage', 5), async (req, res) => {
  try {
    const { name, description, shortDescription, category, brand, price, stock, tags, features, sku } = req.body;

    const images = req.files?.map((file, i) => ({
      url: `/uploads/products/${file.filename}`,
      alt: name,
      isPrimary: i === 0
    })) || [];

    const priceData = typeof price === 'string' ? JSON.parse(price) : price;
    const stockData = typeof stock === 'string' ? JSON.parse(stock) : stock;

    const discountPercent = priceData.original > 0
      ? Math.round(((priceData.original - priceData.selling) / priceData.original) * 100)
      : 0;

    const product = await Product.create({
      name, description, shortDescription, category, brand, sku,
      images,
      price: { ...priceData, discountPercent },
      stock: stockData,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      features: features ? (typeof features === 'string' ? JSON.parse(features) : features) : [],
      priceHistory: [{ price: priceData.selling, changedBy: req.user._id }],
      createdBy: req.user._id
    });

    const populated = await product.populate('category', 'name slug');
    res.status(201).json({ success: true, message: 'Product created successfully!', data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update product (admin)
router.put('/:id', protect, adminOnly, upload.array('productImage', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updates = { ...req.body };
    if (typeof updates.price === 'string') updates.price = JSON.parse(updates.price);
    if (typeof updates.stock === 'string') updates.stock = JSON.parse(updates.stock);
    if (typeof updates.tags === 'string') updates.tags = updates.tags.split(',').map(t => t.trim());

    if (req.files?.length > 0) {
      const newImages = req.files.map((file, i) => ({
        url: `/uploads/products/${file.filename}`,
        alt: updates.name || product.name,
        isPrimary: i === 0 && product.images.length === 0
      }));
      updates.images = [...product.images, ...newImages];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('category', 'name slug');

    res.json({ success: true, message: 'Product updated!', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH update price only (admin) — dedicated endpoint
router.patch('/:id/price', protect, adminOnly, async (req, res) => {
  try {
    const { sellingPrice, originalPrice } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const newSelling = Number(sellingPrice);
    const newOriginal = originalPrice ? Number(originalPrice) : product.price.original;
    const discountPercent = newOriginal > 0 ? Math.round(((newOriginal - newSelling) / newOriginal) * 100) : 0;

    product.price.selling = newSelling;
    product.price.original = newOriginal;
    product.price.discountPercent = discountPercent;
    product.priceHistory.push({ price: newSelling, changedBy: req.user._id });

    await product.save();
    res.json({ success: true, message: `Price updated to ₦${newSelling.toLocaleString()}`, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH update stock (admin)
router.patch('/:id/stock', protect, adminOnly, async (req, res) => {
  try {
    const { quantity, action } = req.body; // action: 'set', 'add', 'subtract'
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    if (action === 'add') product.stock.quantity += Number(quantity);
    else if (action === 'subtract') product.stock.quantity = Math.max(0, product.stock.quantity - Number(quantity));
    else product.stock.quantity = Number(quantity);

    await product.save();
    res.json({ success: true, message: 'Stock updated!', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST add review (customer)
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ success: false, message: 'Already reviewed.' });

    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.ratings.count = product.reviews.length;
    product.ratings.average = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: 'Review added!', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE product (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product removed from store.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
