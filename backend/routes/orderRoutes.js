const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  convertToBill,
  cancelOrder,
  deleteOrder,
  getOrderStats
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Stats route
router.get('/stats/summary', getOrderStats);

// Order routes
router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/convert-to-bill', convertToBill);
router.put('/:id/cancel', cancelOrder);

// Admin only
router.delete('/:id', deleteOrder);

module.exports = router;
