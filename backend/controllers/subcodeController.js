const SubCode = require('../models/SubCode');
const MainCode = require('../models/MainCode');

// @desc    Get all sub codes
// @route   GET /api/subcodes
// @access  Private
exports.getAllSubCodes = async (req, res) => {
  try {
    const { mainCode, isActive, lowStock } = req.query;

    const filter = {};
    if (mainCode) filter.mainCode = mainCode;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    let subCodes = await SubCode.find(filter)
      .populate('mainCode', 'code name')
      .populate('createdBy', 'name')
      .sort({ displayOrder: 1, subCode: 1 });

    // Filter low stock items if requested
    if (lowStock === 'true') {
      subCodes = subCodes.filter(item => {
        // Only include items with stock tracking enabled
        if (item.currentStock === undefined || item.currentStock === null) return false;
        if (item.minStockAlert === undefined || item.minStockAlert === null) return false;
        return item.currentStock <= item.minStockAlert;
      });
    }

    res.status(200).json({
      success: true,
      count: subCodes.length,
      subCodes
    });
  } catch (error) {
    console.error('Get sub codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get sub codes by main code
// @route   GET /api/subcodes/main/:mainCodeId
// @access  Private
exports.getSubCodesByMainCode = async (req, res) => {
  try {
    const subCodes = await SubCode.find({
      mainCode: req.params.mainCodeId,
      isActive: true
    })
      .populate('mainCode', 'code name')
      .sort({ displayOrder: 1, subCode: 1 });

    res.status(200).json({
      success: true,
      count: subCodes.length,
      subCodes
    });
  } catch (error) {
    console.error('Get sub codes by main code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single sub code
// @route   GET /api/subcodes/:id
// @access  Private
exports.getSubCode = async (req, res) => {
  try {
    const subCode = await SubCode.findById(req.params.id)
      .populate('mainCode', 'code name')
      .populate('createdBy', 'name');

    if (!subCode) {
      return res.status(404).json({
        success: false,
        message: 'Sub code not found'
      });
    }

    res.status(200).json({
      success: true,
      subCode
    });
  } catch (error) {
    console.error('Get sub code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create sub code
// @route   POST /api/subcodes
// @access  Private/Admin
exports.createSubCode = async (req, res) => {
  try {
    const {
      mainCode,
      subCode,
      name,
      description,
      price,
      costPrice,
      unit,
      currentStock,
      minStockAlert,
      hsnCode,
      gstPercent,
      displayOrder
    } = req.body;

    if (!mainCode || !subCode || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide mainCode, subCode, name and price'
      });
    }

    // Check if main code exists
    const mainCodeExists = await MainCode.findById(mainCode);
    if (!mainCodeExists) {
      return res.status(404).json({
        success: false,
        message: 'Main code not found'
      });
    }

    // Check if sub code already exists
    const existingSubCode = await SubCode.findOne({ subCode: subCode.toUpperCase() });
    if (existingSubCode) {
      return res.status(400).json({
        success: false,
        message: 'Sub code already exists'
      });
    }

    const newSubCode = await SubCode.create({
      mainCode,
      subCode: subCode.toUpperCase(),
      name,
      description,
      price,
      costPrice: costPrice !== undefined ? costPrice : 0,
      unit: unit || 'Piece',
      currentStock: currentStock !== undefined && currentStock !== null && currentStock !== '' ? currentStock : undefined,
      minStockAlert: minStockAlert !== undefined && minStockAlert !== null && minStockAlert !== '' ? minStockAlert : undefined,
      hsnCode,
      gstPercent: gstPercent !== undefined ? gstPercent : 0,
      displayOrder: displayOrder !== undefined ? displayOrder : 0,
      createdBy: req.user.id
    });

    const populatedSubCode = await SubCode.findById(newSubCode._id)
      .populate('mainCode', 'code name');

    res.status(201).json({
      success: true,
      message: 'Sub code created successfully',
      subCode: populatedSubCode
    });
  } catch (error) {
    console.error('Create sub code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update sub code
// @route   PUT /api/subcodes/:id
// @access  Private/Admin
exports.updateSubCode = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      costPrice,
      unit,
      currentStock,
      minStockAlert,
      hsnCode,
      gstPercent,
      isActive,
      displayOrder
    } = req.body;

    const subCode = await SubCode.findById(req.params.id);

    if (!subCode) {
      return res.status(404).json({
        success: false,
        message: 'Sub code not found'
      });
    }

    // Update fields
    if (name) subCode.name = name;
    if (description !== undefined) subCode.description = description;
    if (price !== undefined) subCode.price = price;
    if (costPrice !== undefined) subCode.costPrice = costPrice;
    if (unit) subCode.unit = unit;
    // Handle currentStock - allow undefined to enable unlimited stock
    if (currentStock !== undefined) {
      subCode.currentStock = currentStock === null || currentStock === '' ? undefined : currentStock;
    }
    if (minStockAlert !== undefined) {
      subCode.minStockAlert = minStockAlert === null || minStockAlert === '' ? undefined : minStockAlert;
    }
    if (hsnCode !== undefined) subCode.hsnCode = hsnCode;
    if (gstPercent !== undefined) subCode.gstPercent = gstPercent;
    if (typeof isActive !== 'undefined') subCode.isActive = isActive;
    if (displayOrder !== undefined) subCode.displayOrder = displayOrder;

    await subCode.save();

    const updatedSubCode = await SubCode.findById(subCode._id)
      .populate('mainCode', 'code name');

    res.status(200).json({
      success: true,
      message: 'Sub code updated successfully',
      subCode: updatedSubCode
    });
  } catch (error) {
    console.error('Update sub code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete sub code
// @route   DELETE /api/subcodes/:id
// @access  Private/Admin
exports.deleteSubCode = async (req, res) => {
  try {
    const subCode = await SubCode.findById(req.params.id);

    if (!subCode) {
      return res.status(404).json({
        success: false,
        message: 'Sub code not found'
      });
    }

    await subCode.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Sub code deleted successfully'
    });
  } catch (error) {
    console.error('Delete sub code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update stock manually
// @route   PUT /api/subcodes/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;

    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide quantity and operation (add/subtract/set)'
      });
    }

    const subCode = await SubCode.findById(req.params.id);

    if (!subCode) {
      return res.status(404).json({
        success: false,
        message: 'Sub code not found'
      });
    }

    // Update stock based on operation
    if (operation === 'add') {
      subCode.currentStock += Number(quantity);
    } else if (operation === 'subtract') {
      subCode.currentStock -= Number(quantity);
      if (subCode.currentStock < 0) subCode.currentStock = 0;
    } else if (operation === 'set') {
      subCode.currentStock = Number(quantity);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use add, subtract, or set'
      });
    }

    await subCode.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      subCode
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get low stock items
// @route   GET /api/subcodes/alerts/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
  try {
    const subCodes = await SubCode.find({ isActive: true })
      .populate('mainCode', 'code name')
      .sort({ currentStock: 1 });

    const lowStockItems = subCodes.filter(item => {
      // Only include items with stock tracking enabled
      if (item.currentStock === undefined || item.currentStock === null) return false;
      if (item.minStockAlert === undefined || item.minStockAlert === null) return false;
      return item.currentStock <= item.minStockAlert;
    });

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload item image
// @route   POST /api/subcodes/:id/upload-image
// @access  Private/Admin
exports.uploadItemImage = async (req, res) => {
  try {
    const subCode = await SubCode.findById(req.params.id);

    if (!subCode) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // If there's an existing image, delete it
    if (subCode.imageUrl) {
      const fs = require('fs');
      const path = require('path');
      const oldImagePath = path.join(__dirname, '..', subCode.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new image URL (relative path)
    subCode.imageUrl = '/uploads/menu-items/' + req.file.filename;
    await subCode.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: subCode.imageUrl
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
};

// @desc    Delete item image
// @route   DELETE /api/subcodes/:id/image
// @access  Private/Admin
exports.deleteItemImage = async (req, res) => {
  try {
    const subCode = await SubCode.findById(req.params.id);

    if (!subCode) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (!subCode.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'No image to delete'
      });
    }

    // Delete image file
    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join(__dirname, '..', subCode.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Clear image URL from database
    subCode.imageUrl = undefined;
    await subCode.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
};
