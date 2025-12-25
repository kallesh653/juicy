const MainCode = require('../models/MainCode');
const SubCode = require('../models/SubCode');
const Table = require('../models/Table');
const Order = require('../models/Order');
const crypto = require('crypto');

// @desc    Get public menu with all categories and items
// @route   GET /api/public/menu
// @access  Public
exports.getPublicMenu = async (req, res) => {
  try {
    // Get all active main codes (categories)
    const mainCodes = await MainCode.find({ isActive: true })
      .select('code name description displayOrder')
      .sort({ displayOrder: 1, name: 1 });

    // Get all active subcodes (items) with images
    const subCodes = await SubCode.find({ isActive: true })
      .populate('mainCode', 'code name')
      .select('mainCode subCode name description price unit imageUrl currentStock')
      .sort({ displayOrder: 1, name: 1 });

    // Organize items by category
    const categories = mainCodes.map(mainCode => {
      const items = subCodes
        .filter(sc => sc.mainCode && sc.mainCode._id.toString() === mainCode._id.toString())
        .map(sc => ({
          _id: sc._id,
          subCode: sc.subCode,
          name: sc.name,
          description: sc.description,
          price: sc.price,
          unit: sc.unit,
          imageUrl: sc.imageUrl,
          isAvailable: sc.currentStock === undefined || sc.currentStock === null || sc.currentStock > 0
        }));

      return {
        _id: mainCode._id,
        code: mainCode.code,
        name: mainCode.name,
        description: mainCode.description,
        displayOrder: mainCode.displayOrder,
        items
      };
    });

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Public menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load menu'
    });
  }
};

// @desc    Validate table and get table info
// @route   GET /api/public/table/:tableId
// @access  Public
exports.validateTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId)
      .select('tableNumber tableName seatingCapacity location status isActive');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (!table.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This table is currently inactive'
      });
    }

    res.status(200).json({
      success: true,
      table: {
        _id: table._id,
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        seatingCapacity: table.seatingCapacity,
        location: table.location,
        status: table.status,
        isActive: table.isActive
      }
    });
  } catch (error) {
    console.error('Table validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate table'
    });
  }
};

// @desc    Create public order (customer order via QR code)
// @route   POST /api/public/orders
// @access  Public
exports.createPublicOrder = async (req, res) => {
  try {
    const {
      tableId,
      items,
      customerName,
      customerMobile,
      specialInstructions,
      subtotal,
      gstAmount,
      totalAmount,
      grandTotal
    } = req.body;

    // Validate table
    const table = await Table.findById(tableId);
    if (!table || !table.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table'
      });
    }

    // Check if table is already occupied
    if (table.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Table is already occupied. Please contact staff for assistance.'
      });
    }

    // Validate and process items
    const orderItems = [];
    for (const item of items) {
      const subCode = await SubCode.findById(item.subCode);
      if (!subCode || !subCode.isActive) {
        return res.status(400).json({
          success: false,
          message: `Item ${item.itemName} is not available`
        });
      }

      // Verify price matches
      if (subCode.price !== item.price) {
        return res.status(400).json({
          success: false,
          message: `Price mismatch for ${item.itemName}. Please refresh and try again.`
        });
      }

      // Check stock if tracked
      if (subCode.currentStock !== undefined && subCode.currentStock !== null) {
        if (subCode.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.itemName}`
          });
        }
        // Deduct stock
        subCode.currentStock -= item.quantity;
        await subCode.save();
      }

      orderItems.push({
        mainCode: subCode.mainCode,
        subCode: subCode._id,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit || subCode.unit,
        price: item.price,
        itemTotal: item.quantity * item.price,
        costPrice: subCode.costPrice
      });
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    // Create order
    const order = await Order.create({
      orderType: 'Dine-In',
      table: tableId,
      tableNumber: table.tableNumber,
      tableName: table.tableName,
      userId: null, // No user for customer orders
      orderSource: 'Customer-QR',
      isCustomerOrder: true,
      confirmationToken,
      customerName: customerName || 'Guest',
      customerMobile: customerMobile || '',
      guestCount: 1,
      items: orderItems,
      subtotal,
      gstAmount: gstAmount || 0,
      totalAmount,
      grandTotal,
      orderStatus: 'Active',
      specialInstructions: specialInstructions || ''
    });

    // Update table status
    table.status = 'Occupied';
    table.currentOrder = order._id;
    await table.save();

    res.status(201).json({
      success: true,
      order: {
        _id: order._id,
        orderNo: order.orderNo,
        tableNumber: table.tableNumber,
        tableName: table.tableName
      },
      confirmationToken
    });
  } catch (error) {
    console.error('Public order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// @desc    Get order confirmation details
// @route   GET /api/public/orders/:orderId/confirmation
// @access  Public (with token)
exports.getOrderConfirmation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation token required'
      });
    }

    const order = await Order.findById(orderId)
      .populate('items.subCode', 'name imageUrl')
      .select('orderNo tableNumber tableName items grandTotal orderDate customerName specialInstructions confirmationToken');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify token
    if (order.confirmationToken !== token) {
      return res.status(403).json({
        success: false,
        message: 'Invalid confirmation token'
      });
    }

    res.status(200).json({
      success: true,
      order: {
        orderNo: order.orderNo,
        tableNumber: order.tableNumber,
        tableName: order.tableName,
        items: order.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          itemTotal: item.itemTotal,
          imageUrl: item.subCode?.imageUrl
        })),
        grandTotal: order.grandTotal,
        orderDate: order.orderDate,
        customerName: order.customerName,
        specialInstructions: order.specialInstructions
      }
    });
  } catch (error) {
    console.error('Order confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load order confirmation'
    });
  }
};
