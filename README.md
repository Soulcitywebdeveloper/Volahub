# VolaHub FMCG E-Commerce Platform

A full-stack e-commerce system for VolaHub — built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JS.

---

## 📁 Project Structure

```
volahub/
├── backend/
│   ├── models/
│   │   ├── User.js          # Customer & Admin accounts
│   │   ├── Product.js       # Product with price history
│   │   ├── Category.js      # Product categories
│   │   └── Order.js         # Orders with status tracking
│   ├── routes/
│   │   ├── auth.js          # Register, login, profile
│   │   ├── products.js      # CRUD + image upload + price update
│   │   ├── orders.js        # Place & manage orders
│   │   ├── categories.js    # Category management
│   │   └── dashboard.js     # Admin analytics
│   ├── middleware/
│   │   ├── auth.js          # JWT protection + role guards
│   │   └── upload.js        # Multer image upload
│   ├── uploads/             # Uploaded product images
│   ├── server.js            # Main Express app
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html           # Customer storefront
    └── admin.html           # Admin dashboard
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

### 2. Backend Setup

```bash
cd volahub/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Your API runs on: `http://localhost:5000`

### 3. Frontend Setup

Simply open the HTML files in a browser or use Live Server (VS Code extension):

```bash
# Option A: VS Code Live Server (recommended)
# Right-click index.html → Open with Live Server

# Option B: Python simple server
cd volahub/frontend
python3 -m http.server 3000
# Open http://localhost:3000
```



## 🌐 API Reference

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Create customer account |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Auth | Get current user |
| PUT | `/api/auth/profile` | Auth | Update profile |
| POST | `/api/auth/seed-superadmin` | Public | Seed first admin (use once) |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | List products (filter, search, paginate) |
| GET | `/api/products/:id` | Public | Single product |
| POST | `/api/products` | Admin | Create product + upload images |
| PUT | `/api/products/:id` | Admin | Update product |
| PATCH | `/api/products/:id/price` | Admin | Update price only |
| PATCH | `/api/products/:id/stock` | Admin | Update stock |
| POST | `/api/products/:id/reviews` | Auth | Add review |
| DELETE | `/api/products/:id` | Admin | Remove product |

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/categories` | Public | List all categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Edit category |
| DELETE | `/api/categories/:id` | Admin | Remove category |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Auth | Place order |
| GET | `/api/orders/my-orders` | Auth | Customer's orders |
| GET | `/api/orders` | Admin | All orders |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |

### Dashboard (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Revenue, orders, products, customers |
| GET | `/api/dashboard/sales-chart` | Last 7 days sales data |

---

## 🔧 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/volahub
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
MAX_FILE_SIZE=5242880
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/volahub
```

---

## ✨ Features

### Customer Storefront (`index.html`)
- 🛍️ Product browsing with grid layout
- 🔍 Live search with debounce
- 🏷️ Category filtering
- 🛒 Cart sidebar with quantity controls
- 💳 Guest checkout prompt
- ❤️ Wishlist (requires login)
- 🔐 Auth modal (login/register)
- 📱 Responsive design
- 🔔 Toast notifications

### Admin Dashboard (`admin.html`)
- 📊 Live stats: revenue, orders, customers, low stock alerts
- 📦 Product management: add, edit, delete
- 📸 Multi-image upload with preview
- 💰 Dedicated price update with history tracking
- 📦 Stock management
- 🧾 Order management with status workflow
- 🏷️ Category management
- 🔒 Role-based access (admin/superadmin)

---

## 🛡️ Security Features
- JWT authentication with expiry
- bcrypt password hashing (12 rounds)
- Role-based route protection (customer / admin / superadmin)
- Multer file type validation
- Input sanitization via Mongoose validators

---

## 🗺️ Roadmap (Next Steps)
- [ ] Paystack / Flutterwave payment integration
- [ ] Email notifications (Nodemailer)
- [ ] Customer order tracking page
- [ ] Coupon/discount code system
- [ ] Product variants (size, weight)
- [ ] Sales analytics charts
- [ ] Push notifications
- [ ] Mobile app (React Native)

---

## 🇳🇬 Built for Nigeria
- Currency: Nigerian Naira (₦)
- VAT: 7.5% (Nigeria standard)
- Free shipping on orders above ₦50,000
- Default country: Nigeria

---

*VolaHub © 2024 — Quality FMCG, Delivered Fast*
