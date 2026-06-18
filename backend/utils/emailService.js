/**
 * VolaHub Email Service
 * Uses Nodemailer with Gmail SMTP
 *
 * Required env vars:
 *   EMAIL_USER   = your_gmail@gmail.com
 *   EMAIL_PASS   = your_16_char_app_password (NOT your Gmail password)
 *   EMAIL_FROM   = VolaHub <your_gmail@gmail.com>
 *   ADMIN_EMAIL  = admin_notification_email@gmail.com (optional, defaults to EMAIL_USER)
 *   FRONTEND_URL = https://volahub-store.onrender.com
 */

const nodemailer = require('nodemailer');

const FRONT = process.env.FRONTEND_URL || 'https://volahub-store.onrender.com';
const fmt   = n => '₦' + Number(n||0).toLocaleString('en-NG');

// ── Create transporter ────────────────────────────────────────────────────────
function makeTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
}

// ── Base HTML wrapper ─────────────────────────────────────────────────────────
const base = (body) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0faf3;color:#1e281e;}
  .wrap{max-width:600px;margin:0 auto;padding:28px 16px;}
  .card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(42,144,80,.1);}
  .hdr{background:linear-gradient(135deg,#0d3d1e 0%,#1f7a3e 55%,#3db065 100%);padding:32px 40px;text-align:center;}
  .logo{font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;}
  .logo span{color:#a3e0b6;}
  .tag{color:rgba(255,255,255,.65);font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;}
  .bdy{padding:36px 40px;}
  .greet{font-size:22px;font-weight:700;margin-bottom:12px;}
  .txt{font-size:15px;color:#4a5e4a;line-height:1.7;margin-bottom:16px;}
  .hi-box{background:#f0faf3;border:1.5px solid #a3e0b6;border-radius:12px;padding:20px 24px;margin:20px 0;}
  .hi-lbl{font-size:12px;color:#8a9e8a;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
  .hi-val{font-size:24px;font-weight:900;color:#1f7a3e;}
  .divider{height:1px;background:#eef2ee;margin:22px 0;}
  table.items{width:100%;border-collapse:collapse;}
  table.items th{font-size:11px;font-weight:700;color:#8a9e8a;text-transform:uppercase;padding:8px 10px;text-align:left;border-bottom:1.5px solid #eef2ee;}
  table.items td{padding:11px 10px;font-size:14px;border-bottom:1px solid #f8faf8;}
  .totals .row{display:flex;justify-content:space-between;font-size:14px;padding:4px 0;color:#4a5e4a;}
  .totals .total{font-size:17px;font-weight:800;color:#1e281e;border-top:2px solid #eef2ee;padding-top:10px;margin-top:6px;}
  .addr-box{background:#f8faf8;border-radius:10px;padding:14px 18px;}
  .addr-lbl{font-size:11px;font-weight:700;color:#8a9e8a;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
  .sb{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;}
  .sb-pending{background:#fef3c7;color:#d97706;}
  .sb-confirmed{background:#dbeafe;color:#1d4ed8;}
  .sb-shipped{background:#ede9fe;color:#7c3aed;}
  .sb-delivered{background:#d1f0da;color:#1f7a3e;}
  .sb-cancelled{background:#fee2e2;color:#b91c1c;}
  .cta{display:block;width:fit-content;margin:24px auto 0;padding:13px 32px;background:#2a9050;color:#fff;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none;text-align:center;}
  .tracker{display:flex;align-items:center;justify-content:space-between;margin:20px 0;position:relative;}
  .tracker::before{content:'';position:absolute;top:13px;left:14px;right:14px;height:3px;background:#eef2ee;}
  .t-step{display:flex;flex-direction:column;align-items:center;gap:7px;z-index:1;}
  .t-dot{width:28px;height:28px;border-radius:50%;background:#eef2ee;border:3px solid #d4ddd4;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
  .t-dot.done{background:#2a9050;border-color:#2a9050;color:white;}
  .t-dot.active{background:white;border-color:#2a9050;color:#2a9050;}
  .t-lbl{font-size:10px;font-weight:600;color:#8a9e8a;text-align:center;text-transform:uppercase;}
  .t-lbl.active{color:#1f7a3e;}
  .tip{background:linear-gradient(135deg,#f0faf3,#d1f0da);border-radius:10px;padding:14px 18px;margin:18px 0;border-left:4px solid #2a9050;}
  .tip p{font-size:13px;color:#1f7a3e;font-weight:500;}
  .ftr{background:#061f0f;padding:24px 40px;text-align:center;}
  .ftr p{color:rgba(255,255,255,.45);font-size:12px;line-height:1.8;}
  .ftr a{color:#3db065;text-decoration:none;}
</style></head><body>
<div class="wrap"><div class="card">
  <div class="hdr">
    <div class="logo">Vola<span>Hub</span></div>
    <div class="tag">Quality FMCG · Fast Delivery · Nigeria 🇳🇬</div>
  </div>
  <div class="bdy">${body}</div>
  <div class="ftr">
    <p>© ${new Date().getFullYear()} VolaHub Ltd. All rights reserved.<br>
    <a href="${FRONT}">Visit Store</a> · <a href="mailto:support@volahub.com">support@volahub.com</a><br>
    14 Adeola Odeku Street, Victoria Island, Lagos</p>
  </div>
</div></div></body></html>`;

// ── Items table ───────────────────────────────────────────────────────────────
const itemsTable = (items) => `
<table class="items">
  <thead><tr><th>Product</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead>
  <tbody>
    ${items.map(i => `<tr>
      <td>${i.name}</td>
      <td>×${i.quantity}</td>
      <td style="text-align:right;font-weight:700;color:#1f7a3e">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')}
  </tbody>
</table>`;

// ── Totals block ──────────────────────────────────────────────────────────────
const totalsBlock = (p) => `
<div class="totals" style="margin-top:14px;">
  <div class="row"><span>Subtotal</span><span>${fmt(p.subtotal)}</span></div>
  <div class="row"><span>Shipping</span><span>${p.shipping===0?'<strong style="color:#2a9050">FREE</strong>':fmt(p.shipping)}</span></div>
  <div class="row"><span>VAT (7.5%)</span><span>${fmt(p.tax)}</span></div>
  <div class="row total"><span>Total</span><span>${fmt(p.total)}</span></div>
</div>`;

// ── Delivery tracker ──────────────────────────────────────────────────────────
const tracker = (status) => {
  const steps = ['pending','confirmed','processing','shipped','delivered'];
  const emojis = {pending:'⏳',confirmed:'✓',processing:'⚙',shipped:'🚚',delivered:'📦'};
  const labels = {pending:'Placed',confirmed:'Confirmed',processing:'Processing',shipped:'Shipped',delivered:'Delivered'};
  const idx = steps.indexOf(status);
  return `<div class="tracker">
    ${steps.map((s,i) => {
      const cls = i < idx ? 'done' : i === idx ? 'active' : '';
      return `<div class="t-step">
        <div class="t-dot ${cls}">${i < idx ? '✓' : emojis[s]}</div>
        <div class="t-lbl ${cls}">${labels[s]}</div>
      </div>`;
    }).join('')}
  </div>`;
};

// ── Send function ─────────────────────────────────────────────────────────────
async function send({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`📧 Email skipped (not configured) → ${to} | ${subject}`);
    return { skipped: true };
  }
  try {
    const info = await makeTransporter().sendMail({
      from: process.env.EMAIL_FROM || `VolaHub <${process.env.EMAIL_USER}>`,
      to, subject, html
    });
    console.log(`📧 Email sent → ${to} | ${subject} | ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error(`📧 Email failed → ${to} | ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════
// EXPORTED FUNCTIONS
// ═══════════════════════════════════════════════════════

module.exports = {

  // 1. Welcome email on registration
  sendWelcomeEmail: (user) => send({
    to: user.email,
    subject: `Welcome to VolaHub, ${user.name.split(' ')[0]}! 🌿`,
    html: base(`
      <div class="greet">Welcome, ${user.name.split(' ')[0]}! 🎉</div>
      <p class="txt">Your VolaHub account is all set up and ready to go. We're excited to have you join Nigeria's premier FMCG marketplace.</p>
      <div class="hi-box">
        <div class="hi-lbl">Your Account</div>
        <div class="hi-val" style="font-size:18px;">${user.email}</div>
      </div>
      <div class="tip"><p>🎁 <strong>First order bonus:</strong> Use code <strong>VOLA15</strong> for 15% off your first purchase!</p></div>
      <a href="${FRONT}" class="cta">Start Shopping →</a>
    `)
  }),

  // 2. Order confirmation after placing an order
  sendOrderConfirmation: (order, user) => {
    const addr = order.shippingAddress || {};
    return send({
      to: user.email,
      subject: `✅ Order Confirmed #${order.orderNumber} – VolaHub`,
      html: base(`
        <div class="greet">Your order is confirmed, ${user.name.split(' ')[0]}! 🎉</div>
        <p class="txt">Thank you for shopping with VolaHub. We've received your order and it's being prepared for processing.</p>
        <div class="hi-box">
          <div class="hi-lbl">Order Number</div>
          <div class="hi-val">#${order.orderNumber}</div>
          <div style="margin-top:8px;"><span class="sb sb-confirmed">Confirmed</span></div>
        </div>
        <div class="divider"></div>
        ${itemsTable(order.items)}
        ${totalsBlock(order.pricing)}
        <div class="divider"></div>
        <div class="addr-box">
          <div class="addr-lbl">📍 Delivering to</div>
          <p style="font-size:14px;line-height:1.7;">
            <strong>${addr.fullName||user.name}</strong><br>
            ${addr.street||''}<br>${addr.city||''}, ${addr.state||''}<br>
            ${addr.phone||''}
          </p>
        </div>
        <div class="tip"><p>💡 Track your order anytime at <strong>My Orders</strong> on the VolaHub website.</p></div>
        <a href="${FRONT}/orders.html" class="cta">Track My Order →</a>
      `)
    });
  },

  // 3. Status update email (confirmed, shipped, delivered, cancelled)
  sendOrderStatusUpdate: (order, user, newStatus, note) => {
    const msgs = {
      confirmed:  { emoji:'✅', title:'Order Confirmed!',          body:'Your order has been confirmed and is being prepared.' },
      processing: { emoji:'⚙️', title:'Order is Being Processed',  body:'Your order is currently being picked and packed at our warehouse.' },
      shipped:    { emoji:'🚚', title:"Your Order is on the Way!", body:'Your order has been dispatched and is heading to you. Expect delivery soon!' },
      delivered:  { emoji:'📦', title:'Order Delivered!',          body:'Your order has been delivered. We hope you love your VolaHub products!' },
      cancelled:  { emoji:'❌', title:'Order Cancelled',           body:'Your order has been cancelled. Contact support if you did not request this.' }
    };
    const m = msgs[newStatus] || { emoji:'📋', title:`Order ${newStatus}`, body:`Your order status has been updated to ${newStatus}.` };
    const subjects = {
      confirmed:'✅ Order Confirmed', processing:'⚙️ Order Processing',
      shipped:'🚚 Your Order is on the Way!', delivered:'📦 Order Delivered!', cancelled:'❌ Order Cancelled'
    };

    return send({
      to: user.email,
      subject: `${subjects[newStatus]||'Order Update'} – #${order.orderNumber}`,
      html: base(`
        <div class="greet">${m.emoji} ${m.title}</div>
        <p class="txt">${m.body}</p>
        <div class="hi-box">
          <div class="hi-lbl">Order Number</div>
          <div class="hi-val">#${order.orderNumber}</div>
          <div style="margin-top:8px;"><span class="sb sb-${newStatus}">${newStatus.charAt(0).toUpperCase()+newStatus.slice(1)}</span></div>
        </div>
        ${newStatus !== 'cancelled' ? tracker(newStatus) : ''}
        ${note ? `<div class="tip"><p>📝 <strong>Note from VolaHub:</strong> ${note}</p></div>` : ''}
        <div class="divider"></div>
        ${itemsTable(order.items)}
        ${totalsBlock(order.pricing)}
        ${newStatus === 'delivered'
          ? `<div class="tip"><p>⭐ Enjoyed your order? Log in and leave a review to help other shoppers!</p></div><a href="${FRONT}" class="cta">Shop Again →</a>`
          : `<a href="${FRONT}/orders.html" class="cta">Track My Order →</a>`
        }
      `)
    });
  },

  // 4. Admin alert when a new order is placed
  sendAdminNewOrderAlert: (order, user) => {
    const adminTo = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminTo) return Promise.resolve({ skipped: true });
    return send({
      to: adminTo,
      subject: `🛒 New Order #${order.orderNumber} – ${user.name}`,
      html: base(`
        <div class="greet">🔔 New Order Received!</div>
        <p class="txt">A new order has been placed and requires your attention.</p>
        <div class="hi-box">
          <div class="hi-lbl">Order Number</div>
          <div class="hi-val">#${order.orderNumber}</div>
          <div style="margin-top:8px;font-size:13px;color:#4a5e4a;">
            Customer: <strong>${user.name}</strong> (${user.email})<br>
            Payment: <strong>${order.paymentMethod}</strong>
          </div>
        </div>
        <div class="divider"></div>
        ${itemsTable(order.items)}
        ${totalsBlock(order.pricing)}
        <a href="${FRONT}/admin.html" class="cta">Manage in Dashboard →</a>
      `)
    });
  }
};
