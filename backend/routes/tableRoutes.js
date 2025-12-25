const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  getTableStats,
  generateTableQRCode,
  getTableQRCode,
  downloadAllQRCodes
} = require('../controllers/tableController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getAllTables);
router.get('/stats/summary', getTableStats);
router.get('/:id', getTableById);
router.get('/:id/qrcode', getTableQRCode);
router.put('/:id/status', updateTableStatus);

// Admin only routes
router.post('/', adminOnly, createTable);
router.put('/:id', adminOnly, updateTable);
router.delete('/:id', adminOnly, deleteTable);

// QR Code routes (admin only)
router.post('/:id/generate-qr', adminOnly, generateTableQRCode);
router.get('/qrcodes/download-all', adminOnly, downloadAllQRCodes);

module.exports = router;
