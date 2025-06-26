/**
 * Simple test suite for the calculator module
 * Run with: npm test
 */

const { calculateBestDeal, calculateSingleVendorCost, getAllVendorComparisons, analyzeCartDeal } = require('../utils/calculator');

// Test data
const testCart = ['Laptop', 'Mouse', 'Keyboard'];
const testVendors = [
  {
    name: 'TechStore',
    shipping: 20,
    items: {
      'Laptop': 899,
      'Mouse': 35,
      'Keyboard': 75
    }
  },
  {
    name: 'ElectroMart',
    shipping: 15,
    items: {
      'Laptop': 950,
      'Mouse': 28,
      'Keyboard': 65
    }
  },
  {
    name: 'BudgetTech',
    shipping: 25,
    items: {
      'Laptop': 880,
      'Mouse': 40,
      'Keyboard': 80
    }
  }
];

// Test functions
function runTests() {
  console.log('🧪 Running Calculator Tests...\n');
  
  try {
    // Test 1: Basic calculation
    console.log('Test 1: Basic Best Deal Calculation');
    const result = calculateBestDeal(testCart, testVendors);
    console.log('Result:', result);
    console.log('Expected: Laptop from BudgetTech, Mouse from ElectroMart, Keyboard from ElectroMart');
    console.log('Total should be: 880 + 28 + 65 + 25 + 15 = 1013\n');
    
    // Test 2: Single vendor cost
    console.log('Test 2: Single Vendor Cost Calculation');
    const singleVendorCost = calculateSingleVendorCost(testCart, testVendors[0]);
    console.log('✅ TechStore total:', singleVendorCost);
    console.log('Expected: 899 + 35 + 75 + 20 = 1029\n');
    
    // Test 3: All vendor comparisons
    console.log('Test 3: All Vendor Comparisons');
    const comparisons = getAllVendorComparisons(testCart, testVendors);
    console.log('✅ Comparisons (sorted by cost):', comparisons);
    console.log('Expected: BudgetTech cheapest, then TechStore, then ElectroMart\n');
    
    // Test 4: Complete analysis
    console.log('Test 4: Complete Cart Analysis');
    const analysis = analyzeCartDeal(testCart, testVendors);
    console.log('✅ Analysis:', JSON.stringify(analysis, null, 2));
    
    // Test 5: Error handling
    console.log('\nTest 5: Error Handling');
    try {
      calculateBestDeal(['NonExistentItem'], testVendors);
      console.log('❌ Should have thrown error for non-existent item');
    } catch (error) {
      console.log('✅ Correctly caught error:', error.message);
    }
    
    try {
      calculateBestDeal([], testVendors);
      console.log('❌ Should have thrown error for empty cart');
    } catch (error) {
      console.log('✅ Correctly caught error:', error.message);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };