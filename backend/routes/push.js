const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const push = require('../utils/pushService');

const router = express.Router();

// GET VAPID public key (client needs this to subscribe)
router.get('/vapid-public-key', (req, res) => {
  const key = push.getVapidPublicKey();
  if (!key) return res.json({ success: false, message: 'Push notifications not configured.' });
  res.json({ success: true, publicKey: key });
});

// Save push subscription from browser
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ success: false, message: 'Subscription data required.' });
    push.saveSubscription(req.user._id, subscription);
    res.json({ success: true, message: 'Push notifications enabled!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Unsubscribe
router.delete('/unsubscribe', protect, (req, res) => {
  try {
    res.json({ success: true, message: 'Push notifications disabled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: send broadcast to all users
router.post('/broadcast', protect, adminOnly, async (req, res) => {
  try {
    const { title, body, url } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body required.' });
    const results = await push.sendToAll({ title, body, icon: `${process.env.FRONTEND_URL}/icon-192.png`, url: url || process.env.FRONTEND_URL });
    res.json({ success: true, message: `Broadcast sent to ${push.subscriptionCount()} subscribers`, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: send flash sale notification
router.post('/flash-sale', protect, adminOnly, async (req, res) => {
  try {
    const { discount } = req.body;
    const payload = push.notifications.flashSale(discount || 20);
    const results = await push.sendToAll(payload);
    res.json({ success: true, message: 'Flash sale notification sent!', results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: stats
router.get('/stats', protect, adminOnly, (req, res) => {
  res.json({ success: true, data: { totalSubscribers: push.subscriptionCount(), configured: !!push.getVapidPublicKey() } });
});

module.exports = router;
