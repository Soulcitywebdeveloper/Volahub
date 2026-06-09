const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'volahub_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found or inactive.' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Super admin access required.' });
  }
  next();
};

module.exports = { protect, adminOnly, superAdminOnly };
