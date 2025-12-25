const express = require('express');
const router = express.Router();
const publicRateLimiter = require('../middleware/publicRateLimiter');
const {
  getPublicMenu,
  validateTable,
  createPublicOrder,
  getOrderConfirmation
} = require('../controllers/publicController');

// Apply rate limiting to all public routes
router.use(publicRateLimiter);

// Menu routes (no auth required)
router.get('/menu', getPublicMenu);

// Table validation
router.get('/table/:tableId', validateTable);

// Order routes
router.post('/orders', createPublicOrder);
router.get('/orders/:orderId/confirmation', getOrderConfirmation);

module.exports = router;
