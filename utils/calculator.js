/**
 * Best Cart Deal Calculator - Core Algorithm
 * 
 * This module contains the core logic for calculating the optimal vendor selection
 * to minimize the total cost of a shopping cart across multiple vendors.
 * 
 * Current Implementation: Greedy Algorithm
 * - For each item, selects the vendor with the lowest price
 * - Adds shipping costs for all selected vendors
 * - Time Complexity: O(n * m) where n = items, m = vendors
 * 
 * Future Enhancement: Could implement dynamic programming for globally optimal solution
 * but current approach works well for most practical cases and is much faster.
 */

/**
 * Calculate the best deal for a shopping cart across multiple vendors
 * @param {Array<string>} cart - List of items to purchase
 * @param {Array<Object>} vendors - List of vendors with their prices and shipping costs
 * @returns {Object} - Best deal with total cost and vendor selection
 */
function calculateBestDeal(cart, vendors) {
  // Validate inputs
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    throw new Error('Cart must be a non-empty array of items');
  }

  if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
    throw new Error('Vendors must be a non-empty array');
  }

  const selection = {}; // Track which vendor is selected for each item
  const selectedVendors = new Set(); // Track which vendors were used (for shipping)
  let totalItemCost = 0;

  // For each item in the cart, find the cheapest vendor
  for (const item of cart) {
    let bestVendor = null;
    let bestPrice = Infinity;

    // Check each vendor's price for this item
    for (const vendor of vendors) {
      // Validate vendor structure
      if (!vendor.name || typeof vendor.shipping !== 'number' || !vendor.items) {
        throw new Error(`Invalid vendor structure: ${JSON.stringify(vendor)}`);
      }

      // Check if vendor has this item and if it's cheaper
      if (vendor.items[item] !== undefined && vendor.items[item] < bestPrice) {
        bestPrice = vendor.items[item];
        bestVendor = vendor.name;
      }
    }

    // If we found a vendor for this item
    if (bestVendor && bestPrice !== Infinity) {
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

  // Return detailed result
  return {
    cheapest_total: parseFloat(cheapestTotal.toFixed(2)),
    selection: selection,
    breakdown: {
      items_cost: parseFloat(totalItemCost.toFixed(2)),
      shipping_cost: parseFloat(totalShipping.toFixed(2)),
      selected_vendors: Array.from(selectedVendors),
      total_vendors_used: selectedVendors.size
    }
  };
}

/**
 * Calculate what it would cost to buy everything from a single vendor
 * Useful for comparison purposes
 * @param {Array<string>} cart - List of items to purchase
 * @param {Object} vendor - Single vendor object
 * @returns {Object|null} - Cost breakdown or null if vendor doesn't have all items
 */
function calculateSingleVendorCost(cart, vendor) {
  if (!vendor.name || typeof vendor.shipping !== 'number' || !vendor.items) {
    return null;
  }

  let totalItemCost = 0;
  
  // Check if vendor has all items
  for (const item of cart) {
    if (vendor.items[item] === undefined) {
      return null; // Vendor doesn't have this item
    }
    totalItemCost += vendor.items[item];
  }

  return {
    vendor_name: vendor.name,
    items_cost: parseFloat(totalItemCost.toFixed(2)),
    shipping_cost: vendor.shipping,
    total_cost: parseFloat((totalItemCost + vendor.shipping).toFixed(2))
  };
}

/**
 * Get comparison data for all vendors that can fulfill the entire cart
 * @param {Array<string>} cart - List of items to purchase
 * @param {Array<Object>} vendors - List of vendors
 * @returns {Array<Object>} - Array of cost comparisons, sorted by total cost
 */
function getAllVendorComparisons(cart, vendors) {
  const comparisons = [];
  
  for (const vendor of vendors) {
    const cost = calculateSingleVendorCost(cart, vendor);
    if (cost) {
      comparisons.push(cost);
    }
  }
  
  // Sort by total cost (cheapest first)
  return comparisons.sort((a, b) => a.total_cost - b.total_cost);
}

/**
 * Advanced analysis of the cart deal including savings calculations
 * @param {Array<string>} cart - List of items to purchase
 * @param {Array<Object>} vendors - List of vendors
 * @returns {Object} - Comprehensive analysis
 */
function analyzeCartDeal(cart, vendors) {
  const optimalDeal = calculateBestDeal(cart, vendors);
  const vendorComparisons = getAllVendorComparisons(cart, vendors);
  
  let analysis = {
    optimal_deal: optimalDeal,
    vendor_comparisons: vendorComparisons,
    savings_analysis: {
      vs_cheapest_single_vendor: 0,
      vs_most_expensive_vendor: 0,
      percentage_saved: 0
    }
  };
  
  if (vendorComparisons.length > 0) {
    const cheapestSingleVendor = vendorComparisons[0].total_cost;
    const mostExpensiveVendor = vendorComparisons[vendorComparisons.length - 1].total_cost;
    
    analysis.savings_analysis = {
      vs_cheapest_single_vendor: parseFloat((cheapestSingleVendor - optimalDeal.cheapest_total).toFixed(2)),
      vs_most_expensive_vendor: parseFloat((mostExpensiveVendor - optimalDeal.cheapest_total).toFixed(2)),
      percentage_saved: parseFloat(((mostExpensiveVendor - optimalDeal.cheapest_total) / mostExpensiveVendor * 100).toFixed(2))
    };
  }
  
  return analysis;
}

module.exports = {
  calculateBestDeal,
  calculateSingleVendorCost,
  getAllVendorComparisons,
  analyzeCartDeal
};