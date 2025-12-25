const mongoose = require('mongoose');

const subCodeSchema = new mongoose.Schema({
  mainCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MainCode',
    required: [true, 'Main code is required']
  },
  subCode: {
    type: String,
    required: [true, 'Sub code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    enum: ['Piece', 'KG', 'Liter', 'ML', 'Gram'],
    default: 'Piece'
  },
  currentStock: {
    type: Number,
    min: 0  // No default - undefined means unlimited stock
  },
  minStockAlert: {
    type: Number,
    min: 0  // No default - only used when stock tracking is enabled
  },
  hsnCode: {
    type: String,
    trim: true
  },
  gstPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  imageUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
subCodeSchema.index({ mainCode: 1 });
subCodeSchema.index({ subCode: 1 });
subCodeSchema.index({ isActive: 1 });
subCodeSchema.index({ currentStock: 1 });

// Virtual for stock alert
subCodeSchema.virtual('isLowStock').get(function() {
  // Only check if stock tracking is enabled
  if (this.currentStock === undefined || this.currentStock === null) return false;
  if (this.minStockAlert === undefined || this.minStockAlert === null) return false;
  return this.currentStock <= this.minStockAlert;
});

module.exports = mongoose.model('SubCode', subCodeSchema);
