const Order = require('../models/Order');
const Table = require('../models/Table');
const SubCode = require('../models/SubCode');
const StockLedger = require('../models/StockLedger');
const Bill = require('../models/Bill');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getAllOrders = async (req, res) => {
  try {
    const { orderStatus, table, startDate, endDate, userId } = req.query;

    const filter = {};
    if (orderStatus) filter.orderStatus = orderStatus;
    if (table) filter.table = table;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    // Non-admin users can only see their own orders
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;
    }

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber tableName location')
      .populate('userId', 'name username')
      .populate('items.subCode', 'name price')
      .sort({ orderDate: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'tableNumber tableName location floor')
      .populate('userId', 'name username')
      .populate('items.subCode', 'name price unit');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Non-admin users can only view their own orders
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      tableId,
      orderType = 'Dine-In',
      items,
      customerName,
      customerMobile,
      guestCount,
      subtotal,
      discountPercent,
      discountAmount,
      gstAmount,
      totalAmount,
      roundOff,
      grandTotal,
      remarks,
      specialInstructions
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item'
      });
    }

    // Only validate table for Dine-In orders
    let table = null;
    let tableNumber = null;
    let tableName = null;

    if (orderType === 'Dine-In') {
      // Check if table exists and is available
      table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }

      if (table.status === 'Occupied') {
        return res.status(400).json({
          success: false,
          message: 'Table is already occupied'
        });
      }

      tableNumber = table.tableNumber;
      tableName = table.tableName;
    }

    // Validate stock and get item details
    for (let item of items) {
      const product = await SubCode.findById(item.subCode);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.itemName} not found`
        });
      }

      // Check stock if tracking is enabled
      if (product.currentStock !== undefined && product.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}`
        });
      }
    }

    // Create order
    const orderData = {
      orderType,
      userId: req.user._id,
      userName: req.user.name,
      customerName,
      customerMobile,
      guestCount,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      gstAmount,
      totalAmount,
      roundOff,
      grandTotal,
      remarks,
      specialInstructions
    };

    // Add table info only for Dine-In orders
    if (orderType === 'Dine-In' && table) {
      orderData.table = tableId;
      orderData.tableNumber = tableNumber;
      orderData.tableName = tableName;
    }

    const order = await Order.create(orderData);

    // Update table status and link order (only for Dine-In)
    if (orderType === 'Dine-In' && table) {
      table.status = 'Occupied';
      table.currentOrder = order._id;
      await table.save();
    }

    // Update stock and create ledger entries
    for (let item of items) {
      const product = await SubCode.findById(item.subCode);

      // Update stock if tracking is enabled
      if (product.currentStock !== undefined) {
        product.currentStock -= item.quantity;
        await product.save();

        // Create stock ledger entry
        await StockLedger.create({
          itemId: product._id,
          itemName: product.name,
          transactionType: 'Sale',
          quantity: item.quantity,
          unit: item.unit,
          rate: item.price,
          transactionDate: new Date(),
          referenceType: 'Order',
          referenceId: order._id,
          referenceNo: order.orderNo,
          balanceQty: product.currentStock,
          remarks: orderType === 'Dine-In' && tableNumber
            ? `Order for Table ${tableNumber}`
            : `${orderType} Order`,
          createdBy: req.user._id
        });
      }
    }

    // Populate order before sending response
    await order.populate('table', 'tableNumber tableName location');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    console.log('[Update Order] Request body:', JSON.stringify(req.body, null, 2));

    const {
      items,
      customerName,
      customerMobile,
      guestCount,
      subtotal,
      discountPercent,
      discountAmount,
      gstAmount,
      totalAmount,
      roundOff,
      grandTotal,
      remarks,
      specialInstructions
    } = req.body;

    const order = await Order.findById(req.params.id);
    console.log('[Update Order] Order found:', order ? 'Yes' : 'No');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is already completed
    if (order.orderStatus === 'Completed' || order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${order.orderStatus.toLowerCase()} order`
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // If items changed, restore old stock and deduct new stock
    if (items && items.length > 0) {
      console.log('[Update Order] Restoring old stock...');
      // Restore old stock
      for (let oldItem of order.items) {
        try {
          // Extract subCode ID (handle both object and string formats)
          const subCodeId = typeof oldItem.subCode === 'object' && oldItem.subCode._id
            ? oldItem.subCode._id
            : oldItem.subCode;

          const product = await SubCode.findById(subCodeId);
          if (product && product.currentStock !== undefined && product.currentStock !== null) {
            const currentStock = Number(product.currentStock);
            const quantityToRestore = Number(oldItem.quantity) || 0;
            product.currentStock = currentStock + quantityToRestore;
            await product.save();
            console.log(`[Update Order] Restored ${quantityToRestore} of ${product.name}, new stock: ${product.currentStock}`);
          }
        } catch (err) {
          console.error(`[Update Order] Error restoring stock for item ${oldItem.subCode}:`, err);
        }
      }

      console.log('[Update Order] Deducting new stock...');
      // Validate and deduct new stock
      for (let newItem of items) {
        // Extract subCode ID (handle both object and string formats)
        const subCodeId = typeof newItem.subCode === 'object' && newItem.subCode._id
          ? newItem.subCode._id
          : newItem.subCode;

        const product = await SubCode.findById(subCodeId);
        if (!product) {
          console.error(`[Update Order] Product not found: ${subCodeId}`);
          return res.status(404).json({
            success: false,
            message: `Product ${newItem.itemName} not found`
          });
        }

        // Only manage stock if currentStock is defined for this product
        if (product.currentStock !== undefined && product.currentStock !== null) {
          const currentStock = Number(product.currentStock);
          const quantityToDeduct = Number(newItem.quantity) || 0;

          // Check if sufficient stock is available
          if (currentStock < quantityToDeduct) {
            console.error(`[Update Order] Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${quantityToDeduct}`);
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${quantityToDeduct}`
            });
          }

          product.currentStock = currentStock - quantityToDeduct;
          await product.save();
          console.log(`[Update Order] Deducted ${quantityToDeduct} of ${product.name}, new stock: ${product.currentStock}`);
        } else {
          console.log(`[Update Order] Skipping stock management for ${product.name} (stock not tracked)`);
        }
      }

      order.items = items;
    }

    // Update other fields
    if (customerName !== undefined) order.customerName = customerName;
    if (customerMobile !== undefined) order.customerMobile = customerMobile;
    if (guestCount !== undefined) order.guestCount = guestCount;
    if (subtotal !== undefined) order.subtotal = subtotal;
    if (discountPercent !== undefined) order.discountPercent = discountPercent;
    if (discountAmount !== undefined) order.discountAmount = discountAmount;
    if (gstAmount !== undefined) order.gstAmount = gstAmount;
    if (totalAmount !== undefined) order.totalAmount = totalAmount;
    if (roundOff !== undefined) order.roundOff = roundOff;
    if (grandTotal !== undefined) order.grandTotal = grandTotal;
    if (remarks !== undefined) order.remarks = remarks;
    if (specialInstructions !== undefined) order.specialInstructions = specialInstructions;

    console.log('[Update Order] Saving order...');
    await order.save();

    await order.populate('table', 'tableNumber tableName');

    console.log('[Update Order] Order updated successfully');
    res.json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('[Update Order] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === 'Served') {
      order.servedTime = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// @desc    Convert order to bill
// @route   POST /api/orders/:id/convert-to-bill
// @access  Private
exports.convertToBill = async (req, res) => {
  try {
    const { paymentMode, paymentDetails } = req.body;

    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.orderStatus === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Order is already completed'
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot convert cancelled order to bill'
      });
    }

    // Create bill from order
    const bill = await Bill.create({
      userId: order.userId,
      userName: order.userName,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      items: order.items,
      subtotal: order.subtotal,
      discountPercent: order.discountPercent,
      discountAmount: order.discountAmount,
      gstAmount: order.gstAmount,
      totalAmount: order.totalAmount,
      roundOff: order.roundOff,
      grandTotal: order.grandTotal,
      paymentMode,
      paymentDetails,
      status: 'Completed',
      remarks: `Table ${order.tableNumber} - ${order.remarks || ''}`
    });

    // Update order
    order.orderStatus = 'Completed';
    order.completionTime = new Date();
    order.isPaid = true;
    order.billId = bill._id;
    await order.save();

    // Free the table
    const table = await Table.findById(order.table);
    if (table) {
      table.status = 'Available';
      table.currentOrder = null;
      await table.save();
    }

    res.json({
      success: true,
      message: 'Order converted to bill successfully',
      order,
      bill
    });
  } catch (error) {
    console.error('Convert to bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert order to bill',
      error: error.message
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.orderStatus === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed order'
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Restore stock
    for (let item of order.items) {
      const product = await SubCode.findById(item.subCode);
      if (product && product.currentStock !== undefined) {
        product.currentStock += item.quantity;
        await product.save();

        // Create stock ledger entry
        await StockLedger.create({
          itemId: product._id,
          itemName: product.name,
          transactionType: 'Return',
          quantity: item.quantity,
          unit: item.unit,
          rate: item.price,
          transactionDate: new Date(),
          referenceType: 'Order',
          referenceId: order._id,
          referenceNo: order.orderNo,
          balanceQty: product.currentStock,
          remarks: `Order Cancelled - ${reason || 'No reason provided'}`,
          createdBy: req.user._id
        });
      }
    }

    // Update order
    order.orderStatus = 'Cancelled';
    order.completionTime = new Date();
    order.remarks = `${order.remarks || ''}\nCancelled: ${reason || 'No reason provided'}`;
    await order.save();

    // Free the table
    const table = await Table.findById(order.table);
    if (table) {
      table.status = 'Available';
      table.currentOrder = null;
      await table.save();
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin/Creator only)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this order'
      });
    }

    // Only allow deletion of cancelled orders
    if (order.orderStatus !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled orders can be deleted. Please cancel the order first.'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats/summary
// @access  Private
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({ orderStatus: { $in: ['Active', 'Ready', 'Served'] } });
    const completedToday = await Order.countDocuments({
      orderStatus: 'Completed',
      completionTime: { $gte: today }
    });

    // Calculate today's revenue from completed orders
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          orderStatus: 'Completed',
          completionTime: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        activeOrders,
        completedToday,
        todayRevenue: todayRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};
