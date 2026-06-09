const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'volahub_secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ name, email, password, phone });
    const token = signToken(user._id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch(err => console.error('Welcome email error:', err));

    res.status(201).json({ success: true, message: 'Account created successfully!', token, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account suspended.' });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const token = signToken(user._id);

    res.json({ success: true, message: 'Login successful!', token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, address }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Create admin (superadmin only — use for initial setup)
router.post('/create-admin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({ success: true, message: 'Admin created!', user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Seed first superadmin (REMOVE IN PRODUCTION)
router.post('/seed-superadmin', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'superadmin' });
    if (count > 0) return res.status(400).json({ success: false, message: 'Superadmin already exists.' });

    const admin = await User.create({
      name: 'VolaHub Admin',
      email: 'admin@volahub.com',
      password: 'VolaHub@2024',
      role: 'superadmin'
    });
    const token = signToken(admin._id);
    res.status(201).json({ success: true, message: 'Superadmin created!', token, user: admin });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
