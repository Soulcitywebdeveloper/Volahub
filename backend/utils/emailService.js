const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

// Base email template wrapper
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0faf3; color: #1e281e; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,144,80,0.10); }
  .header { background: linear-gradient(135deg, #0d3d1e 0%, #1f7a3e 50%, #3db065 100%); padding: 36px 40px; text-align: center; }
  .logo { font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
  .logo span { color: #a3e0b6; }
  .header-tag { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .body { padding: 36px 40px; }
  .greeting { font-size: 22px; font-weight: 700; color: #1e281e; margin-bottom: 12px; }
  .text { font-size: 15px; color: #4a5e4a; line-height: 1.7; margin-bottom: 16px; }
  .highlight-box { background: #f0faf3; border: 1.5px solid #a3e0b6; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
  .order-num { font-size: 13px; color: #8a9e8a; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .order-val { font-size: 24px; font-weight: 900; color: #1f7a3e; letter-spacing: -0.5px; }
  .divider { height: 1px; background: #eef2ee; margin: 24px 0; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { font-size: 11px; font-weight: 700; color: #8a9e8a; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; text-align: left; border-bottom: 1.5px solid #eef2ee; }
  .items-table td { padding: 12px 12px; font-size: 14px; border-bottom: 1px solid #f8faf8; vertical-align: middle; }
  .item-name { font-weight: 600; color: #1e281e; }
  .item-qty { color: #8a9e8a; font-size: 13px; }
  .item-price { font-weight: 700; color: #1f7a3e; text-align: right; }
  .totals { margin-top: 16px; }
  .tot-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; color: #4a5e4a; }
  .tot-row.total { font-size: 17px; font-weight: 800; color: #1e281e; border-top: 2px solid #eef2ee; padding-top: 12px; margin-top: 8px; }
  .address-box { background: #f8faf8; border-radius: 10px; padding: 16px 20px; }
  .address-label { font-size: 11px; font-weight: 700; color: #8a9e8a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .address-text { font-size: 14px; color: #1e281e; line-height: 1.7; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-pending { background: #fef3c7; color: #d97706; }
  .status-confirmed { background: #dbeafe; color: #1d4ed8; }
  .status-processing { background: #dbeafe; color: #1d4ed8; }
  .status-shipped { background: #ede9fe; color: #7c3aed; }
  .status-delivered { background: #d1f0da; color: #1f7a3e; }
  .status-cancelled { background: #fee2e2; color: #b91c1c; }
  .cta-btn { display: block; width: fit-content; margin: 24px auto 0; padding: 14px 36px; background: #2a9050; color: #ffffff; border-radius: 50px; font-size: 15px; font-weight: 700; text-decoration: none; text-align: center; }
  .tracker { display: flex; align-items: center; justify-content: space-between; margin: 24px 0; position: relative; }
  .tracker::before { content: ''; position: absolute; top: 14px; left: 28px; right: 28px; height: 3px; background: #eef2ee; z-index: 0; }
  .track-step { display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1; }
  .track-dot { width: 28px; height: 28px; border-radius: 50%; background: #eef2ee; border: 3px solid #d4ddd4; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
  .track-dot.done { background: #2a9050; border-color: #2a9050; color: white; }
  .track-dot.active { background: white; border-color: #2a9050; color: #2a9050; box-shadow: 0 0 0 4px rgba(42,144,80,0.15); }
  .track-label { font-size: 10px; font-weight: 600; color: #8a9e8a; text-align: center; text-transform: uppercase; letter-spacing: 0.3px; }
  .track-label.active { color: #1f7a3e; }
  .footer { background: #061f0f; padding: 28px 40px; text-align: center; }
  .footer p { color: rgba(255,255,255,0.5); font-size: 12px; line-height: 1.8; }
  .footer a { color: #3db065; text-decoration: none; }
  .social { margin-top: 16px; display: flex; gap: 12px; justify-content: center; }
  .tip-box { background: linear-gradient(135deg, #f0faf3, #d1f0da); border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #2a9050; }
  .tip-box p { font-size: 13px; color: #1f7a3e; font-weight: 500; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="logo">Vola<span>Hub</span></div>
      <div class="header-tag">Quality FMCG · Fast Delivery · Nigeria</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>
        © ${new Date().getFullYear()} VolaHub Ltd. All rights reserved.<br>
        Quality FMCG delivered across Nigeria 🇳🇬<br>
        <a href="${process.env.FRONTEND_URL || 'https://volahub-store.onrender.com'}">Visit Store</a> · 
        <a href="mailto:support@volahub.com">support@volahub.com</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

// Format currency
const fmt = (n) => `₦${Number(n).toLocaleString('en-NG')}`;

// Render order items table
const itemsTable = (items) => `
<table class="items-table">
  <thead><tr><th>Product</th><th>Qty</th><th style="text-align:right;">Price</th></tr></thead>
  <tbody>
    ${items.map(i => `
    <tr>
      <td class="item-name">${i.name}</td>
      <td class="item-qty">×${i.quantity}</td>
      <td class="item-price">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')}
  </tbody>
</table>`;

// Render totals block
const totalsBlock = (pricing) => `
<div class="totals">
  <div class="tot-row"><span>Subtotal</span><span>${fmt(pricing.subtotal)}</span></div>
  <div class="tot-row"><span>Shipping</span><span>${pricing.shipping === 0 ? '<strong style="color:#2a9050">FREE</strong>' : fmt(pricing.shipping)}</span></div>
  <div class="tot-row"><span>VAT (7.5%)</span><span>${fmt(pricing.tax)}</span></div>
  <div class="tot-row total"><span>Total</span><span>${fmt(pricing.total)}</span></div>
</div>`;

// Render status tracker
const statusTracker = (currentStatus) => {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const emojis = { pending: '⏳', confirmed: '✓', processing: '⚙', shipped: '🚚', delivered: '📦' };
  const labels = { pending: 'Placed', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };
  const currentIdx = steps.indexOf(currentStatus);

  return `<div class="tracker">
    ${steps.map((s, i) => {
      const cls = i < currentIdx ? 'done' : i === currentIdx ? 'active' : '';
      return `<div class="track-step">
        <div class="track-dot ${cls}">${i < currentIdx ? '✓' : emojis[s]}</div>
        <div class="track-label ${cls}">${labels[s]}</div>
      </div>`;
    }).join('')}
  </div>`;
};

// =============================================
// EMAIL TEMPLATES
// =============================================

// 1. Order Confirmation Email
const orderConfirmationEmail = (order, user) => {
  const addr = order.shippingAddress;
  return baseTemplate(`
    <div class="greeting">Hi ${user.name.split(' ')[0]}, your order is confirmed! 🎉</div>
    <p class="text">Thank you for shopping with VolaHub. We've received your order and it's being prepared for processing.</p>

    <div class="highlight-box">
      <div class="order-num">Order Number</div>
      <div class="order-val">#${order.orderNumber}</div>
      <div style="margin-top:8px;">
        <span class="status-badge status-confirmed">Confirmed</span>
      </div>
    </div>

    <div class="divider"></div>
    <p style="font-size:13px;font-weight:700;color:#8a9e8a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Order Items</p>
    ${itemsTable(order.items)}
    ${totalsBlock(order.pricing)}

    <div class="divider"></div>
    <div class="address-box">
      <div class="address-label">📍 Delivering to</div>
      <div class="address-text">
        <strong>${addr.fullName}</strong><br>
        ${addr.street}<br>
        ${addr.city}, ${addr.state}<br>
        ${addr.country} · ${addr.phone}
      </div>
    </div>

    <div class="tip-box">
      <p>💡 <strong>Pro tip:</strong> You can track your order anytime by visiting <strong>My Orders</strong> on the VolaHub website.</p>
    </div>

    <a href="${process.env.FRONTEND_URL || 'https://volahub-store.onrender.com'}/orders.html" class="cta-btn">Track My Order →</a>
  `);
};

// 2. Order Status Update Email
const orderStatusEmail = (order, user, newStatus, note) => {
  const statusMessages = {
    confirmed: { emoji: '✅', title: 'Order Confirmed!', msg: 'Great news! Your order has been confirmed and is being prepared.' },
    processing: { emoji: '⚙️', title: 'Order is Being Processed', msg: 'Your order is currently being picked and packed at our warehouse.' },
    shipped: { emoji: '🚚', title: 'Your Order is on the Way!', msg: 'Your order has been dispatched and is on its way to you. Expect delivery soon!' },
    delivered: { emoji: '📦', title: 'Order Delivered!', msg: 'Your order has been delivered. We hope you love your VolaHub products!' },
    cancelled: { emoji: '❌', title: 'Order Cancelled', msg: 'Your order has been cancelled. If you did not request this, please contact our support team.' }
  };

  const info = statusMessages[newStatus] || { emoji: '📋', title: `Order ${newStatus}`, msg: `Your order status has been updated to ${newStatus}.` };

  return baseTemplate(`
    <div class="greeting">${info.emoji} ${info.title}</div>
    <p class="text">${info.msg}</p>

    <div class="highlight-box">
      <div class="order-num">Order Number</div>
      <div class="order-val">#${order.orderNumber}</div>
      <div style="margin-top:8px;">
        <span class="status-badge status-${newStatus}">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span>
      </div>
    </div>

    ${newStatus !== 'cancelled' ? statusTracker(newStatus) : ''}

    ${note ? `<div class="tip-box"><p>📝 <strong>Note from VolaHub:</strong> ${note}</p></div>` : ''}

    <div class="divider"></div>
    <p style="font-size:13px;font-weight:700;color:#8a9e8a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Your Items</p>
    ${itemsTable(order.items)}
    ${totalsBlock(order.pricing)}

    ${newStatus === 'delivered' ? `
    <div class="tip-box">
      <p>⭐ <strong>Enjoyed your order?</strong> Log in and leave a review to help other shoppers!</p>
    </div>
    <a href="${process.env.FRONTEND_URL || 'https://volahub-store.onrender.com'}" class="cta-btn">Shop Again →</a>
    ` : `
    <a href="${process.env.FRONTEND_URL || 'https://volahub-store.onrender.com'}/orders.html" class="cta-btn">Track My Order →</a>
    `}
  `);
};

// 3. Welcome Email
const welcomeEmail = (user) => {
  return baseTemplate(`
    <div class="greeting">Welcome to VolaHub, ${user.name.split(' ')[0]}! 🌿</div>
    <p class="text">We're excited to have you join Nigeria's premier FMCG marketplace. Your account is all set up and ready to go.</p>

    <div class="highlight-box">
      <div class="order-num">Your Account</div>
      <div class="order-val">${user.email}</div>
      <div style="margin-top:8px;font-size:13px;color:#4a5e4a;">Customer Account · Joined ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>

    <div class="divider"></div>
    <p style="font-size:14px;font-weight:700;color:#1e281e;margin-bottom:12px;">Here's what you can do:</p>

    <table style="width:100%;border-collapse:collapse;">
      ${[
        ['🛍️', 'Browse Products', 'Hundreds of FMCG products at great prices'],
        ['🚚', 'Fast Delivery', 'Delivered to your door within 48 hours'],
        ['💰', 'Best Prices', 'Guaranteed quality at competitive prices'],
        ['📦', 'Track Orders', 'Real-time order tracking at every step'],
      ].map(([icon, title, desc]) => `
      <tr>
        <td style="padding:10px 12px;font-size:22px;width:44px;">${icon}</td>
        <td style="padding:10px 12px;">
          <div style="font-size:14px;font-weight:700;color:#1e281e;">${title}</div>
          <div style="font-size:13px;color:#4a5e4a;">${desc}</div>
        </td>
      </tr>`).join('')}
    </table>

    <div class="tip-box" style="margin-top:24px;">
      <p>🎁 <strong>First order bonus:</strong> Use code <strong>VOLA15</strong> for 15% off your first purchase!</p>
    </div>

    <a href="${process.env.FRONTEND_URL || 'https://volahub-store.onrender.com'}" class="cta-btn">Start Shopping →</a>
  `);
};

// 4. Admin new order notification
const adminNewOrderEmail = (order, user) => {
  return baseTemplate(`
    <div class="greeting">🔔 New Order Received!</div>
    <p class="text">A new order has been placed on VolaHub and requires your attention.</p>

    <div class="highlight-box">
      <div class="order-num">Order Number</div>
      <div class="order-val">#${order.orderNumber}</div>
      <div style="margin-top:8px;font-size:13px;color:#4a5e4a;">
        Customer: <strong>${user.name}</strong> (${user.email})<br>
        Payment: <strong>${order.paymentMethod}</strong>
      </div>
    </div>

    <div class="divider"></div>
    ${itemsTable(order.items)}
    ${totalsBlock(order.pricing)}

    <a href="${process.env.FRONTEND_URL || 'https://volahub-store.onrender.com'}/admin.html" class="cta-btn">Manage Order in Dashboard →</a>
  `);
};

// =============================================
// SEND FUNCTIONS
// =============================================

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email not configured — skipping email send');
    return { skipped: true };
  }
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `VolaHub <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendWelcomeEmail: async (user) => {
    return sendEmail({
      to: user.email,
      subject: `Welcome to VolaHub, ${user.name.split(' ')[0]}! 🌿`,
      html: welcomeEmail(user)
    });
  },

  sendOrderConfirmation: async (order, user) => {
    return sendEmail({
      to: user.email,
      subject: `Order Confirmed #${order.orderNumber} – VolaHub`,
      html: orderConfirmationEmail(order, user)
    });
  },

  sendOrderStatusUpdate: async (order, user, newStatus, note) => {
    const subjects = {
      confirmed: `✅ Order Confirmed – #${order.orderNumber}`,
      processing: `⚙️ Processing Your Order – #${order.orderNumber}`,
      shipped: `🚚 Your Order is on the Way! – #${order.orderNumber}`,
      delivered: `📦 Order Delivered – #${order.orderNumber}`,
      cancelled: `❌ Order Cancelled – #${order.orderNumber}`
    };
    return sendEmail({
      to: user.email,
      subject: subjects[newStatus] || `Order Update – #${order.orderNumber}`,
      html: orderStatusEmail(order, user, newStatus, note)
    });
  },

  sendAdminNewOrderAlert: async (order, user) => {
    if (!process.env.ADMIN_EMAIL && !process.env.EMAIL_USER) return;
    return sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🛒 New Order #${order.orderNumber} – ${user.name}`,
      html: adminNewOrderEmail(order, user)
    });
  }
};
