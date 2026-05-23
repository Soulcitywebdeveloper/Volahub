# 🌿 VolaHub E-Commerce Platform

A full-stack FMCG e-commerce website with MongoDB backend.

## Project Structure
```
volahub/
├── backend/
│   ├── models/         # MongoDB models (Product, Order)
│   ├── routes/         # API routes (products, orders)
│   ├── server.js       # Express server entry point
│   ├── package.json
│   └── .env.example    # Copy to .env and fill in values
└── frontend/
    └── public/
        └── index.html  # Full frontend (store + admin panel)
```

## 🚀 Hosting Setup

### Requirements
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### Steps
1. Unzip the project
2. `cd volahub/backend`
3. `cp .env.example .env` — then set your MongoDB URI
4. `npm install`
5. `npm start`
6. Open http://localhost:5000

### Deploy to Render / Railway / VPS
- Set environment variable: `MONGODB_URI=mongodb+srv://...`
- Set `PORT` if needed
- Run command: `npm start`
- Build directory: `backend/`

## Features
- 🛒 Customer storefront with cart & checkout
- 🔍 Search & filter by category
- 📦 Admin: Upload products with images
- 💰 Admin: Update prices in real-time
- 📋 Admin: Order management dashboard
- 📊 Revenue & stats dashboard
