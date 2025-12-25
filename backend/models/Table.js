const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  tableName: {
    type: String,
    required: [true, 'Table name is required'],
    trim: true
  },
  seatingCapacity: {
    type: Number,
    required: [true, 'Seating capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    default: 4
  },
  location: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'Balcony', 'VIP', 'Garden'],
    default: 'Indoor'
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
    default: 'Available'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  floor: {
    type: String,
    enum: ['Ground', 'First', 'Second', 'Rooftop'],
    default: 'Ground'
  },
  shape: {
    type: String,
    enum: ['Square', 'Round', 'Rectangle', 'Booth'],
    default: 'Square'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  qrCodeUrl: {
    type: String,
    trim: true
  },
  qrCodeData: {
    type: String,
    trim: true
  },
  menuUrl: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
tableSchema.index({ status: 1, isActive: 1 });
tableSchema.index({ floor: 1 });

// Virtual for occupied time
tableSchema.virtual('occupiedDuration').get(function() {
  if (this.status === 'Occupied' && this.updatedAt) {
    return Date.now() - this.updatedAt.getTime();
  }
  return 0;
});

module.exports = mongoose.model('Table', tableSchema);
