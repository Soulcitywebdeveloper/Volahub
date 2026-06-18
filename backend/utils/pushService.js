/**
 * VolaHub Push Notification Service
 * Uses Web Push API (VAPID) for browser push notifications
 * Works on both desktop and mobile browsers
 *
 * Setup:
 *   npm install web-push
 *   node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k);"
 *   Then add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to your .env
 */

const webpush = require('web-push');

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_USER || 'admin@volahub.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// In-memory store (replace with MongoDB in production)
// For production, save subscriptions to a PushSubscription collection
const subscriptions = new Map();

// ─── SAVE SUBSCRIPTION ────────────────────────────────────────────────────────
function saveSubscription(userId, subscription) {
  subscriptions.set(String(userId), subscription);
  console.log(`🔔 Push subscription saved for user ${userId}`);
}

// ─── GET SUBSCRIPTION ─────────────────────────────────────────────────────────
function getSubscription(userId) {
  return subscriptions.get(String(userId));
}

// ─── SEND TO ONE USER ─────────────────────────────────────────────────────────
async function sendToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('🔔 Push skipped — VAPID keys not configured');
    return { skipped: true };
  }

  const subscription = getSubscription(userId);
  if (!subscription) {
    console.log(`🔔 No push subscription for user ${userId}`);
    return { noSubscription: true };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log(`🔔 Push sent to user ${userId}: ${payload.title}`);
    return { success: true };
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — remove it
      subscriptions.delete(String(userId));
      console.log(`🔔 Removed expired subscription for user ${userId}`);
    } else {
      console.error(`🔔 Push failed for user ${userId}: ${err.message}`);
    }
    return { success: false, error: err.message };
  }
}

// ─── SEND TO ALL SUBSCRIBERS ──────────────────────────────────────────────────
async function sendToAll(payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return { skipped: true };
  const results = [];
  for (const [userId] of subscriptions) {
    results.push(await sendToUser(userId, payload));
  }
  return results;
}

// ─── NOTIFICATION TEMPLATES ───────────────────────────────────────────────────
const FRONT = process.env.FRONTEND_URL || 'https://volahub-store.onrender.com';

const notifications = {
  orderConfirmed: (orderNumber) => ({
    title:   '✅ Order Confirmed – VolaHub',
    body:    `Your order #${orderNumber} has been confirmed and is being prepared.`,
    icon:    `${FRONT}/icon-192.png`,
    badge:   `${FRONT}/badge-72.png`,
    url:     `${FRONT}/orders.html`,
    tag:     `order-${orderNumber}`,
    vibrate: [200, 100, 200]
  }),

  orderShipped: (orderNumber) => ({
    title:   '🚚 Your Order is on the Way!',
    body:    `Order #${orderNumber} has been dispatched. It's heading to you now!`,
    icon:    `${FRONT}/icon-192.png`,
    url:     `${FRONT}/orders.html`,
    tag:     `order-${orderNumber}`
  }),

  orderDelivered: (orderNumber) => ({
    title:   '📦 Order Delivered!',
    body:    `Order #${orderNumber} has been delivered. Enjoy your VolaHub products!`,
    icon:    `${FRONT}/icon-192.png`,
    url:     `${FRONT}/orders.html`,
    tag:     `order-${orderNumber}`
  }),

  newProduct: (productName, category) => ({
    title:   '🆕 New Product on VolaHub!',
    body:    `${productName} is now available in ${category}. Shop now!`,
    icon:    `${FRONT}/icon-192.png`,
    url:     `${FRONT}/index.html`
  }),

  flashSale: (discount) => ({
    title:   `🔥 Flash Sale – ${discount}% Off!`,
    body:    'Limited time offer! Shop now before stock runs out.',
    icon:    `${FRONT}/icon-192.png`,
    url:     `${FRONT}/index.html`,
    requireInteraction: true
  }),

  lowStockAlert: (productName, quantity) => ({
    title:   '⚠️ Low Stock Alert',
    body:    `${productName} has only ${quantity} units left. Restock soon!`,
    icon:    `${FRONT}/icon-192.png`,
    url:     `${FRONT}/admin.html`
  })
};

module.exports = {
  saveSubscription,
  getSubscription,
  sendToUser,
  sendToAll,
  notifications,
  getVapidPublicKey: () => process.env.VAPID_PUBLIC_KEY || null,
  subscriptionCount: () => subscriptions.size
};
