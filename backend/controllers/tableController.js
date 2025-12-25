const Table = require('../models/Table');
const Order = require('../models/Order');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
exports.getAllTables = async (req, res) => {
  try {
    const { status, floor, location, isActive } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (floor) filter.floor = floor;
    if (location) filter.location = location;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const tables = await Table.find(filter)
      .populate('currentOrder', 'orderNo grandTotal orderStatus items')
      .populate('createdBy', 'name username')
      .sort({ displayOrder: 1, tableNumber: 1 });

    res.json({
      success: true,
      count: tables.length,
      tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
      error: error.message
    });
  }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private
exports.getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('currentOrder')
      .populate('createdBy', 'name username');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({
      success: true,
      table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table',
      error: error.message
    });
  }
};

// @desc    Create new table
// @route   POST /api/tables
// @access  Private (Admin only)
exports.createTable = async (req, res) => {
  try {
    const {
      tableNumber,
      tableName,
      seatingCapacity,
      location,
      floor,
      shape,
      description
    } = req.body;

    // Check if table number already exists
    const existingTable = await Table.findOne({ tableNumber: tableNumber.toUpperCase() });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: `Table ${tableNumber} already exists`
      });
    }

    const table = await Table.create({
      tableNumber: tableNumber.toUpperCase(),
      tableName,
      seatingCapacity,
      location,
      floor,
      shape,
      description,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create table',
      error: error.message
    });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private (Admin only)
exports.updateTable = async (req, res) => {
  try {
    const {
      tableNumber,
      tableName,
      seatingCapacity,
      location,
      floor,
      shape,
      description,
      isActive
    } = req.body;

    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if table is occupied
    if (table.status === 'Occupied' && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate an occupied table'
      });
    }

    // Check if new table number already exists
    if (tableNumber && tableNumber.toUpperCase() !== table.tableNumber) {
      const existingTable = await Table.findOne({
        tableNumber: tableNumber.toUpperCase(),
        _id: { $ne: req.params.id }
      });

      if (existingTable) {
        return res.status(400).json({
          success: false,
          message: `Table ${tableNumber} already exists`
        });
      }
    }

    // Update fields
    if (tableNumber) table.tableNumber = tableNumber.toUpperCase();
    if (tableName) table.tableName = tableName;
    if (seatingCapacity) table.seatingCapacity = seatingCapacity;
    if (location) table.location = location;
    if (floor) table.floor = floor;
    if (shape) table.shape = shape;
    if (description !== undefined) table.description = description;
    if (isActive !== undefined) table.isActive = isActive;

    await table.save();

    res.json({
      success: true,
      message: 'Table updated successfully',
      table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update table',
      error: error.message
    });
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Admin only)
exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if table is occupied
    if (table.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied table. Please complete or cancel the order first.'
      });
    }

    await Table.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete table',
      error: error.message
    });
  }
};

// @desc    Update table status
// @route   PUT /api/tables/:id/status
// @access  Private
exports.updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    table.status = status;

    // If marking as available, clear current order
    if (status === 'Available') {
      table.currentOrder = null;
    }

    await table.save();

    res.json({
      success: true,
      message: 'Table status updated successfully',
      table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update table status',
      error: error.message
    });
  }
};

// @desc    Get table statistics
// @route   GET /api/tables/stats/summary
// @access  Private
exports.getTableStats = async (req, res) => {
  try {
    const totalTables = await Table.countDocuments({ isActive: true });
    const availableTables = await Table.countDocuments({ status: 'Available', isActive: true });
    const occupiedTables = await Table.countDocuments({ status: 'Occupied', isActive: true });
    const reservedTables = await Table.countDocuments({ status: 'Reserved', isActive: true });

    const occupancyRate = totalTables > 0
      ? ((occupiedTables / totalTables) * 100).toFixed(2)
      : 0;

    // Get active orders count
    const activeOrders = await Order.countDocuments({ orderStatus: { $in: ['Active', 'Ready'] } });

    res.json({
      success: true,
      stats: {
        totalTables,
        availableTables,
        occupiedTables,
        reservedTables,
        occupancyRate: parseFloat(occupancyRate),
        activeOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table statistics',
      error: error.message
    });
  }
};

// @desc    Generate QR code for table
// @route   POST /api/tables/:id/generate-qr
// @access  Private (Admin only)
exports.generateTableQRCode = async (req, res) => {
  try {
    const QRCode = require('qrcode');
    const fs = require('fs');
    const path = require('path');

    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Create QR codes directory if it doesn't exist
    const qrCodesDir = path.join(__dirname, '../public/qrcodes');
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir, { recursive: true });
    }

    // Generate menu URL
    const baseUrl = process.env.CUSTOMER_MENU_BASE_URL || 'http://localhost:5173';
    const menuUrl = `${baseUrl}/menu/${table._id}`;

    // Generate QR code filename
    const qrCodeFilename = `table-${table.tableNumber.toLowerCase()}.png`;
    const qrCodePath = path.join(qrCodesDir, qrCodeFilename);

    // Generate QR code
    await QRCode.toFile(qrCodePath, menuUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // Update table with QR code info
    table.qrCodeUrl = `/qrcodes/${qrCodeFilename}`;
    table.qrCodeData = menuUrl;
    table.menuUrl = menuUrl;
    await table.save();

    res.json({
      success: true,
      message: 'QR code generated successfully',
      qrCodeUrl: table.qrCodeUrl,
      menuUrl: table.menuUrl
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
};

// @desc    Get table QR code
// @route   GET /api/tables/:id/qrcode
// @access  Private
exports.getTableQRCode = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .select('tableNumber tableName qrCodeUrl qrCodeData menuUrl');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (!table.qrCodeUrl) {
      return res.status(404).json({
        success: false,
        message: 'QR code not generated for this table yet'
      });
    }

    res.json({
      success: true,
      table: {
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        qrCodeUrl: table.qrCodeUrl,
        menuUrl: table.menuUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get QR code',
      error: error.message
    });
  }
};

// @desc    Download all QR codes
// @route   GET /api/tables/qrcodes/download-all
// @access  Private (Admin only)
exports.downloadAllQRCodes = async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true });

    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active tables found'
      });
    }

    const QRCode = require('qrcode');
    const fs = require('fs');
    const path = require('path');
    const archiver = require('archiver');

    // Create QR codes directory if it doesn't exist
    const qrCodesDir = path.join(__dirname, '../public/qrcodes');
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir, { recursive: true });
    }

    const baseUrl = process.env.CUSTOMER_MENU_BASE_URL || 'http://localhost:5173';

    // Generate QR codes for all tables
    for (const table of tables) {
      const menuUrl = `${baseUrl}/menu/${table._id}`;
      const qrCodeFilename = `table-${table.tableNumber.toLowerCase()}.png`;
      const qrCodePath = path.join(qrCodesDir, qrCodeFilename);

      await QRCode.toFile(qrCodePath, menuUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H'
      });

      // Update table with QR code info
      table.qrCodeUrl = `/qrcodes/${qrCodeFilename}`;
      table.qrCodeData = menuUrl;
      table.menuUrl = menuUrl;
      await table.save();
    }

    // Create ZIP file
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('table-qr-codes.zip');
    archive.pipe(res);

    // Add all QR code files to the archive
    archive.directory(qrCodesDir, false);

    await archive.finalize();
  } catch (error) {
    console.error('Download all QR codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download QR codes',
      error: error.message
    });
  }
};
