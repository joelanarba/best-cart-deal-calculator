const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Get port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Allow cross-origin requests from frontend

// Serve static files from public directory (for production)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Calculate the best deal for a shopping cart across multiple vendors
 * @param {Array} cart - List of items to purchase
 * @param {Array} vendors - List of vendors with their prices and shipping costs
 * @returns {Object} - Best deal with total cost and vendor selection
 */
function calculateBestDeal(cart, vendors) {
  const selection = {}; // Track which vendor is selected for each item
  const selectedVendors = new Set(); // Track which vendors were used (for shipping)
  let totalItemCost = 0;

  // For each item in the cart, find the cheapest vendor
  for (const item of cart) {
    let bestVendor = null;
    let bestPrice = Infinity;

    // Check each vendor's price for this item
    for (const vendor of vendors) {
      if (vendor.items[item] && vendor.items[item] < bestPrice) {
        bestPrice = vendor.items[item];
        bestVendor = vendor.name;
      }
    }

    // If we found a vendor for this item
    if (bestVendor) {
      selection[item] = bestVendor;
      selectedVendors.add(bestVendor);
      totalItemCost += bestPrice;
    } else {
      // Item not available from any vendor
      throw new Error(`Item "${item}" is not available from any vendor`);
    }
  }

  // Calculate total shipping cost (only for vendors that were selected)
  let totalShipping = 0;
  for (const vendor of vendors) {
    if (selectedVendors.has(vendor.name)) {
      totalShipping += vendor.shipping;
    }
  }

  const cheapestTotal = totalItemCost + totalShipping;

  return {
    cheapest_total: cheapestTotal,
    selection: selection
  };
}

// POST endpoint to calculate best deal
app.post('/best-deal', (req, res) => {
  try {
    const { cart, vendors } = req.body;

    // Validate input
    if (!cart || !Array.isArray(cart)) {
      return res.status(400).json({ error: 'Cart must be an array of items' });
    }

    if (!vendors || !Array.isArray(vendors)) {
      return res.status(400).json({ error: 'Vendors must be an array' });
    }

    // Validate vendor structure
    for (const vendor of vendors) {
      if (!vendor.name || typeof vendor.shipping !== 'number' || !vendor.items) {
        return res.status(400).json({ 
          error: 'Each vendor must have name, shipping (number), and items object' 
        });
      }
    }

    // Calculate the best deal
    const result = calculateBestDeal(cart, vendors);
    
    // Return the result
    res.json(result);

  } catch (error) {
    console.error('Error calculating best deal:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Best Cart Deal Calculator API running on http://localhost:${PORT}`);
  console.log(`📋 POST /best-deal - Calculate best deal for your cart`);
  console.log(`❤️  GET /health - Check server status`);
});

module.exports = app;