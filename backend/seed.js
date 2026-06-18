/**
 * VolaHub Database Seed Script
 * Run: node seed.js
 * Seeds categories and sample FMCG products
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://soulcitytech:08098448608@cluster0.kazbhoi.mongodb.net/?appName=Cluster0';

const categories = [
  { name: 'Beverages', slug: 'beverages', icon: '🥤', description: 'Drinks, juices, water, carbonated drinks' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥛', description: 'Milk, cheese, butter, eggs' },
  { name: 'Snacks & Confectionery', slug: 'snacks', icon: '🍪', description: 'Biscuits, chips, chocolates, candy' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', description: 'Soap, shampoo, skincare, hygiene' },
  { name: 'Household Cleaning', slug: 'household', icon: '🧹', description: 'Detergents, disinfectants, cleaning supplies' },
  { name: 'Baby & Kids', slug: 'baby-kids', icon: '👶', description: 'Baby food, diapers, kids products' },
  { name: 'Cooking & Condiments', slug: 'cooking', icon: '🧂', description: 'Oils, seasonings, sauces, spices' },
  { name: 'Grains & Cereals', slug: 'grains', icon: '🌾', description: 'Rice, pasta, oats, cereals, noodles' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([Category.deleteMany({}), Product.deleteMany({})]);
    console.log('🗑️  Cleared existing categories and products');

    // Create or get admin user
    let admin = await User.findOne({ role: 'superadmin' });
    if (!admin) {
      admin = await User.create({
        name: 'VolaHub Admin',
        email: 'admin@volahub.com',
        password: 'VolaHub@2024',
        role: 'superadmin'
      });
      console.log('👑 Admin user created: admin@volahub.com / VolaHub@2024');
    }

    // Create categories
    const createdCats = await Category.insertMany(categories);
    const catMap = {};
    createdCats.forEach(c => { catMap[c.slug] = c._id; });
    console.log(`📂 Created ${createdCats.length} categories`);

    // Products data
    const products = [
      // BEVERAGES
      {
        name: 'Coca-Cola Classic 50cl',
        description: 'The original, world-famous Coca-Cola carbonated soft drink. Refreshing with every sip. Best served chilled.',
        shortDescription: 'Classic carbonated cola drink, 50cl bottle',
        category: catMap['beverages'], brand: 'Coca-Cola',
        price: { original: 350, selling: 300, currency: 'NGN' },
        stock: { quantity: 500, unit: 'bottle', lowStockThreshold: 50 },
        tags: ['cola', 'soda', 'soft drink', 'chilled'], isFeatured: true,
        ratings: { average: 4.8, count: 2341 }
      },
      {
        name: 'Milo Active Go 400g Tin',
        description: 'Nestlé Milo is a chocolate and malt powder mixed with hot or cold milk to produce a nutritious and energizing drink. Packed with ACTIGEN-E, vitamins and minerals.',
        shortDescription: 'Chocolate malt energy drink powder, 400g',
        category: catMap['beverages'], brand: 'Nestlé',
        price: { original: 3500, selling: 3200, currency: 'NGN' },
        stock: { quantity: 180, unit: 'tin', lowStockThreshold: 20 },
        tags: ['milo', 'chocolate', 'energy', 'kids'], isFeatured: true, isNewArrival: false,
        ratings: { average: 4.9, count: 3102 }
      },
      {
        name: 'Lipton Yellow Label Tea 100 bags',
        description: 'Lipton Yellow Label Tea is a premium blend of teas from the finest tea gardens. Rich, flavourful and great-tasting tea for every occasion.',
        shortDescription: 'Premium blend tea bags, pack of 100',
        category: catMap['beverages'], brand: 'Lipton',
        price: { original: 2200, selling: 1950, currency: 'NGN' },
        stock: { quantity: 220, unit: 'pack', lowStockThreshold: 30 },
        tags: ['tea', 'lipton', 'hot drink', 'brew'],
        ratings: { average: 4.6, count: 892 }
      },
      {
        name: 'Bigi Apple Juice 35cl (Pack of 6)',
        description: 'Bigi Apple Juice is made from real apples, delivering a naturally sweet and refreshing taste. No artificial colors. Great for the whole family.',
        shortDescription: 'Real apple juice, 35cl x 6 pack',
        category: catMap['beverages'], brand: 'Bigi',
        price: { original: 1800, selling: 1500, currency: 'NGN' },
        stock: { quantity: 300, unit: 'pack', lowStockThreshold: 40 },
        tags: ['juice', 'apple', 'fruit drink', 'kids'], isNewArrival: true,
        ratings: { average: 4.4, count: 431 }
      },

      // DAIRY & EGGS
      {
        name: 'Peak Full Cream Milk 400g Tin',
        description: "Peak Milk is Nigeria's most loved full cream milk. Packed with calcium, protein and vitamins to nourish you and your family every day.",
        shortDescription: 'Full cream powdered milk, 400g tin',
        category: catMap['dairy-eggs'], brand: 'Peak',
        price: { original: 4200, selling: 3800, currency: 'NGN' },
        stock: { quantity: 150, unit: 'tin', lowStockThreshold: 20 },
        tags: ['milk', 'dairy', 'full cream', 'peak'], isFeatured: true,
        ratings: { average: 4.9, count: 5420 }
      },
      {
        name: "Cowbell Chocolate Milk Sachet (10 x 25g)",
        description: 'Cowbell Chocolate Milk sachets are creamy, chocolatey and delicious. Perfect for quick breakfast or snack. Just mix with hot water.',
        shortDescription: 'Chocolate milk sachets, 10 x 25g',
        category: catMap['dairy-eggs'], brand: 'Cowbell',
        price: { original: 1100, selling: 950, currency: 'NGN' },
        stock: { quantity: 400, unit: 'pack', lowStockThreshold: 50 },
        tags: ['milk', 'chocolate', 'cowbell', 'sachets'],
        ratings: { average: 4.5, count: 1230 }
      },
      {
        name: 'Dano Full Cream Milk Powder 360g',
        description: 'Dano Full Cream Milk Powder is rich, creamy and full of essential nutrients. Made from high-quality milk for a smooth, satisfying taste.',
        shortDescription: 'Full cream milk powder, 360g pouch',
        category: catMap['dairy-eggs'], brand: 'Dano',
        price: { original: 3600, selling: 3200, currency: 'NGN' },
        stock: { quantity: 8, unit: 'pouch', lowStockThreshold: 15 },
        tags: ['milk', 'dairy', 'dano'], isNewArrival: true,
        ratings: { average: 4.7, count: 643 }
      },

      // SNACKS
      {
        name: 'Pringles Original 165g',
        description: "Pringles Original crisps - the iconic saddle-shaped crisps in the iconic can. Perfectly seasoned, impossibly addictive. Once you pop, you can't stop!",
        shortDescription: 'Original flavour potato crisps, 165g can',
        category: catMap['snacks'], brand: 'Pringles',
        price: { original: 3500, selling: 2900, currency: 'NGN' },
        stock: { quantity: 120, unit: 'can', lowStockThreshold: 20 },
        tags: ['crisps', 'chips', 'snack', 'pringles'], isFeatured: true,
        ratings: { average: 4.7, count: 2100 }
      },
      {
        name: "Digestive McVitie's Original 400g",
        description: "McVitie's Digestive Biscuits are the nation's favourite. Made with wholewheat flour and a hint of sweetness. Perfect with tea or as a standalone snack.",
        shortDescription: 'Wholegrain digestive biscuits, 400g pack',
        category: catMap['snacks'], brand: "McVitie's",
        price: { original: 2800, selling: 2400, currency: 'NGN' },
        stock: { quantity: 200, unit: 'pack', lowStockThreshold: 30 },
        tags: ['biscuits', 'digestive', 'wholegrain', 'tea'],
        ratings: { average: 4.6, count: 876 }
      },
      {
        name: 'Richoco Chocolate Wafer 130g',
        description: 'Richoco chocolate wafers are crispy, light, and filled with rich chocolate cream. A delightful treat for kids and adults alike.',
        shortDescription: 'Chocolate cream wafer biscuits, 130g',
        category: catMap['snacks'], brand: 'Richoco',
        price: { original: 800, selling: 650, currency: 'NGN' },
        stock: { quantity: 350, unit: 'pack', lowStockThreshold: 50 },
        tags: ['wafer', 'chocolate', 'biscuit', 'snack'], isNewArrival: true,
        ratings: { average: 4.3, count: 320 }
      },

      // PERSONAL CARE
      {
        name: 'Dettol Original Antibacterial Soap 175g',
        description: 'Dettol Original Soap kills 99.9% of bacteria and provides effective protection against germs and infections. Trusted by families worldwide for over 80 years.',
        shortDescription: 'Antibacterial protection soap bar, 175g',
        category: catMap['personal-care'], brand: 'Dettol',
        price: { original: 650, selling: 550, currency: 'NGN' },
        stock: { quantity: 600, unit: 'piece', lowStockThreshold: 80 },
        tags: ['soap', 'antibacterial', 'dettol', 'hygiene'], isFeatured: true,
        ratings: { average: 4.8, count: 4560 }
      },
      {
        name: 'Head & Shoulders Classic Clean 400ml',
        description: 'Head & Shoulders Classic Clean shampoo fights dandruff and leaves your hair feeling clean and fresh. Clinically proven formula with ZPT technology.',
        shortDescription: 'Anti-dandruff shampoo, 400ml bottle',
        category: catMap['personal-care'], brand: 'Head & Shoulders',
        price: { original: 3200, selling: 2700, currency: 'NGN' },
        stock: { quantity: 90, unit: 'bottle', lowStockThreshold: 15 },
        tags: ['shampoo', 'anti-dandruff', 'hair care'],
        ratings: { average: 4.5, count: 1892 }
      },
      {
        name: 'Vaseline Intensive Care Lotion 400ml',
        description: 'Vaseline Intensive Care body lotion deeply moisturizes and heals dry skin. With micro-droplets of Vaseline Jelly, it provides lasting moisturization.',
        shortDescription: 'Deep moisturizing body lotion, 400ml',
        category: catMap['personal-care'], brand: 'Vaseline',
        price: { original: 2800, selling: 2300, currency: 'NGN' },
        stock: { quantity: 130, unit: 'bottle', lowStockThreshold: 20 },
        tags: ['lotion', 'moisturizer', 'vaseline', 'skin care'], isNewArrival: true,
        ratings: { average: 4.7, count: 2234 }
      },
      {
        name: 'Always Maxi Pads Night 8 pads',
        description: 'Always Maxi Night pads provide up to 8 hours of overnight protection. With LeakGuard Core and wings for maximum security and comfort.',
        shortDescription: 'Overnight maxi pads with wings, 8 count',
        category: catMap['personal-care'], brand: 'Always',
        price: { original: 1200, selling: 1000, currency: 'NGN' },
        stock: { quantity: 400, unit: 'pack', lowStockThreshold: 60 },
        tags: ['pads', 'feminine hygiene', 'always', 'night'],
        ratings: { average: 4.6, count: 3100 }
      },

      // HOUSEHOLD
      {
        name: 'Omo Multi-Active Washing Powder 2kg',
        description: 'OMO Multi-Active removes tough stains even in cold water. Advanced formula with stain-lifting enzymes for brilliantly clean clothes wash after wash.',
        shortDescription: 'Powerful laundry detergent powder, 2kg',
        category: catMap['household'], brand: 'OMO',
        price: { original: 4500, selling: 3900, currency: 'NGN' },
        stock: { quantity: 200, unit: 'pack', lowStockThreshold: 30 },
        tags: ['detergent', 'laundry', 'omo', 'washing powder'], isFeatured: true,
        ratings: { average: 4.7, count: 3240 }
      },
      {
        name: 'Dettol Multi-Purpose Disinfectant 500ml',
        description: 'Dettol Multi-Purpose Disinfectant kills 99.9% of bacteria and viruses on household surfaces. Suitable for all hard surfaces including floors, tables and bathrooms.',
        shortDescription: 'Multi-surface antibacterial disinfectant, 500ml',
        category: catMap['household'], brand: 'Dettol',
        price: { original: 2100, selling: 1750, currency: 'NGN' },
        stock: { quantity: 180, unit: 'bottle', lowStockThreshold: 25 },
        tags: ['disinfectant', 'cleaning', 'dettol', 'hygiene'],
        ratings: { average: 4.8, count: 1450 }
      },
      {
        name: 'Morning Fresh Dishwashing Liquid 750ml',
        description: 'Morning Fresh cuts through grease and removes tough food residues with ease. Gentle on hands with a fresh scent that leaves dishes sparkling clean.',
        shortDescription: 'Grease-cutting dish soap, 750ml bottle',
        category: catMap['household'], brand: 'Morning Fresh',
        price: { original: 1600, selling: 1350, currency: 'NGN' },
        stock: { quantity: 0, unit: 'bottle', lowStockThreshold: 30 },
        tags: ['dish soap', 'washing up', 'kitchen', 'cleaning'],
        ratings: { average: 4.5, count: 780 }
      },

      // COOKING
      {
        name: 'Knorr Chicken Seasoning Cubes (50 cubes)',
        description: 'Knorr Chicken Cubes bring out the best natural flavour in every meal. Made with real chicken and spices for rich, delicious taste in soups, stews and rice dishes.',
        shortDescription: 'Chicken flavour seasoning cubes, pack of 50',
        category: catMap['cooking'], brand: 'Knorr',
        price: { original: 1000, selling: 850, currency: 'NGN' },
        stock: { quantity: 750, unit: 'pack', lowStockThreshold: 100 },
        tags: ['seasoning', 'knorr', 'cooking', 'chicken'], isFeatured: true,
        ratings: { average: 4.9, count: 8920 }
      },
      {
        name: 'Devon King Vegetable Oil 5 Litres',
        description: "Devon King's Vegetable Oil is cholesterol-free and rich in Vitamin E. Perfect for frying, baking and all cooking needs. Made from 100% pure vegetable sources.",
        shortDescription: 'Pure vegetable cooking oil, 5 litre bottle',
        category: catMap['cooking'], brand: "Devon King's",
        price: { original: 8500, selling: 7800, currency: 'NGN' },
        stock: { quantity: 80, unit: 'bottle', lowStockThreshold: 15 },
        tags: ['oil', 'vegetable oil', 'cooking oil', 'frying'],
        ratings: { average: 4.6, count: 2100 }
      },
      {
        name: 'Heinz Tomato Ketchup 570g',
        description: 'Heinz Tomato Ketchup — made from sun-ripened tomatoes with the perfect blend of spices and vinegar for that signature Heinz taste loved worldwide.',
        shortDescription: 'Classic tomato ketchup, 570g bottle',
        category: catMap['cooking'], brand: 'Heinz',
        price: { original: 2600, selling: 2200, currency: 'NGN' },
        stock: { quantity: 160, unit: 'bottle', lowStockThreshold: 25 },
        tags: ['ketchup', 'heinz', 'sauce', 'condiment'], isNewArrival: true,
        ratings: { average: 4.7, count: 1340 }
      },

      // GRAINS
      {
        name: 'Indomie Super Pack Chicken 120g (x10)',
        description: "Nigeria's favourite instant noodles. Indomie Super Pack is ready in 3 minutes with rich chicken flavour seasoning. A quick, delicious meal anytime.",
        shortDescription: 'Chicken flavour instant noodles, 10 x 120g',
        category: catMap['grains'], brand: 'Indomie',
        price: { original: 3500, selling: 3000, currency: 'NGN' },
        stock: { quantity: 500, unit: 'carton', lowStockThreshold: 60 },
        tags: ['noodles', 'indomie', 'instant', 'chicken'], isFeatured: true,
        ratings: { average: 4.9, count: 12500 }
      },
      {
        name: 'Quaker Oats Original 1kg',
        description: 'Quaker 100% Natural Oats — a wholesome, heart-healthy breakfast that keeps you energized all morning. Rich in fibre and packed with nutrients.',
        shortDescription: '100% natural rolled oats, 1kg pack',
        category: catMap['grains'], brand: 'Quaker',
        price: { original: 3200, selling: 2800, currency: 'NGN' },
        stock: { quantity: 140, unit: 'pack', lowStockThreshold: 20 },
        tags: ['oats', 'quaker', 'breakfast', 'fibre'],
        ratings: { average: 4.7, count: 2890 }
      },

      // BABY
      {
        name: 'Pampers Baby Dry Size 3 (56 pcs)',
        description: 'Pampers Baby-Dry nappies provide up to 12 hours of overnight protection with their unique 3-layer absorbency system. Soft, comfortable fit for babies 6-10kg.',
        shortDescription: 'Baby dry nappies size 3 (6-10kg), 56 pack',
        category: catMap['baby-kids'], brand: 'Pampers',
        price: { original: 8500, selling: 7500, currency: 'NGN' },
        stock: { quantity: 90, unit: 'pack', lowStockThreshold: 15 },
        tags: ['diapers', 'pampers', 'baby', 'nappies'], isFeatured: true,
        ratings: { average: 4.8, count: 4320 }
      },
      {
        name: 'SMA Pro First Infant Milk 800g',
        description: 'SMA PRO First Infant Milk is nutritionally complete formula for babies from birth. Contains GOS/FOS prebiotic blend and DHA/ARA for healthy brain development.',
        shortDescription: 'Complete first infant formula, 800g tin',
        category: catMap['baby-kids'], brand: 'SMA',
        price: { original: 12000, selling: 10500, currency: 'NGN' },
        stock: { quantity: 45, unit: 'tin', lowStockThreshold: 10 },
        tags: ['formula', 'baby milk', 'infant', 'sma'], isNewArrival: true,
        ratings: { average: 4.7, count: 890 }
      }
    ];

    // Add price history to all products
    const productsWithHistory = products.map(p => ({
      ...p,
      priceHistory: [{ price: p.price.selling, changedBy: admin._id }],
      createdBy: admin._id
    }));

    const created = await Product.insertMany(productsWithHistory);
    console.log(`📦 Created ${created.length} sample products`);

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Admin Login:');
    console.log('   Email:    admin@volahub.com');
    console.log('   Password: VolaHub@2024');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Start the server: npm run dev');
    console.log('🛒 Open: frontend/index.html');
    console.log('📊 Admin: frontend/admin.html');

    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seed error:', err);
    mongoose.disconnect();
    process.exit(1);
  }
}

seed();
