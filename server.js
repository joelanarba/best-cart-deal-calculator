const express = require('express');
const cors = require('cors');
const path = require('path');
const { calculateBestDeal } = require('./utils/calculator');

const app = express();

// Get port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON requests with size limit
app.use(cors()); // Allow cross-origin requests from frontend

// Input sanitization middleware
app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
});

// Serve static files from public directory (for production)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return obj.trim().slice(0, 1000); // Limit string length
    }
    if (Array.isArray(obj)) {
        return obj.slice(0, 100).map(sanitizeObject); // Limit array size
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        Object.keys(obj).slice(0, 50).forEach(key => { // Limit object keys
            const sanitizedKey = key.trim().slice(0, 100);
            sanitized[sanitizedKey] = sanitizeObject(obj[key]);
        });
        return sanitized;
    }
    return obj;
}

/**
 * Validate request data structure
 */
function validateRequestData(data) {
    const { cart, vendors } = data;

    // Validate cart
    if (!cart || !Array.isArray(cart)) {
        throw new Error('Cart must be an array of items');
    }

    if (cart.length === 0) {
        throw new Error('Cart cannot be empty');
    }

    if (cart.length > 50) {
        throw new Error('Cart cannot have more than 50 items');
    }

    // Validate cart items
    cart.forEach((item, index) => {
        if (typeof item !== 'string' || !item.trim()) {
            throw new Error(`Cart item ${index + 1} must be a non-empty string`);
        }
    });

    // Validate vendors
    if (!vendors || !Array.isArray(vendors)) {
        throw new Error('Vendors must be an array');
    }

    if (vendors.length === 0) {
        throw new Error('At least one vendor is required');
    }

    if (vendors.length > 20) {
        throw new Error('Cannot have more than 20 vendors');
    }

    // Validate vendor structure
    vendors.forEach((vendor, index) => {
        if (!vendor.name || typeof vendor.name !== 'string' || !vendor.name.trim()) {
            throw new Error(`Vendor ${index + 1} must have a valid name`);
        }

        if (typeof vendor.shipping !== 'number' || vendor.shipping < 0) {
            throw new Error(`Vendor ${index + 1} must have a valid shipping fee (number >= 0)`);
        }

        if (!vendor.items || typeof vendor.items !== 'object') {
            throw new Error(`Vendor ${index + 1} must have an items object`);
        }

        // Validate item prices
        Object.entries(vendor.items).forEach(([itemName, price]) => {
            if (typeof price !== 'number' || price < 0) {
                throw new Error(`Invalid price for item "${itemName}" from vendor "${vendor.name}"`);
            }
        });
    });

    return true;
}

// POST endpoint to calculate best deal
app.post('/best-deal', (req, res) => {
    try {
        const startTime = Date.now();
        
        // Validate input structure
        validateRequestData(req.body);
        
        const { cart, vendors } = req.body;

        // Calculate the best deal
        const result = calculateBestDeal(cart, vendors);
        
        // Add performance metrics for debugging
        const processingTime = Date.now() - startTime;
        console.log(`Processed request in ${processingTime}ms for ${cart.length} items and ${vendors.length} vendors`);
        
        // Return the result
        res.json({
            ...result,
            processing_time_ms: processingTime
        });

    } catch (error) {
        console.error('Error calculating best deal:', error.message);
        
        // Return appropriate error status
        const statusCode = error.message.includes('must') || error.message.includes('cannot') ? 400 : 500;
        res.status(statusCode).json({ 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint with more details
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Server is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0'
    });
});

// API documentation endpoint
app.get('/api-docs', (req, res) => {
    res.json({
        title: 'Best Cart Deal Calculator API',
        version: '2.0.0',
        endpoints: {
            'POST /best-deal': {
                description: 'Calculate the best deal for a shopping cart',
                body: {
                    cart: ['item1', 'item2'],
                    vendors: [
                        {
                            name: 'Vendor Name',
                            shipping: 10.50,
                            items: {
                                'item1': 25.99,
                                'item2': 15.50
                            }
                        }
                    ]
                },
                response: {
                    cheapest_total: 52.99,
                    selection: {
                        'item1': 'Vendor Name',
                        'item2': 'Vendor Name'
                    }
                }
            },
            'GET /health': {
                description: 'Check server health and status'
            }
        }
    });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Best Cart Deal Calculator API v2.0 running on http://localhost:${PORT}`);
    console.log(`📋 POST /best-deal - Calculate best deal for your cart`);
    console.log(`❤️  GET /health - Check server status`);
    console.log(`📚 GET /api-docs - View API documentation`);
});

module.exports = app;