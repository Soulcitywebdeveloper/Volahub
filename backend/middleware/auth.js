const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'volahub_secret_2024');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

module.exports = { protect, adminOnly };
