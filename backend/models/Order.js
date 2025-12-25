const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  mainCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MainCode'
  },
  mainCodeName: String,
  subCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCode',
    required: true
  },
  subCodeName: String,
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unit: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  itemTotal: {
    type: Number,
    required: true
  },
  costPrice: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready', 'Served'],
    default: 'Pending'
  },
  notes: String
});

const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true
  },
  orderType: {
    type: String,
    enum: ['Dine-In', 'Parcel', 'Takeaway'],
    default: 'Dine-In'
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: function() {
      return this.orderType === 'Dine-In';
    }
  },
  tableNumber: String,
  tableName: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isCustomerOrder;
    }
  },
  orderSource: {
    type: String,
    enum: ['Staff', 'Customer-QR'],
    default: 'Staff'
  },
  isCustomerOrder: {
    type: Boolean,
    default: false
  },
  confirmationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  userName: String,
  customerName: {
    type: String,
    trim: true
  },
  customerMobile: {
    type: String,
    trim: true
  },
  guestCount: {
    type: Number,
    default: 1,
    min: 1
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  gstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  roundOff: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  orderStatus: {
    type: String,
    enum: ['Active', 'Ready', 'Served', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  orderDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  servedTime: Date,
  completionTime: Date,
  remarks: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  }
}, {
  timestamps: true
});

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      console.log('[Order] Pre-save hook triggered for new order');
      const BusinessSettings = mongoose.model('BusinessSettings');
      let settings = await BusinessSettings.findOne();
      console.log('[Order] BusinessSettings found:', settings ? 'Yes' : 'No');

      if (!settings) {
        console.log('[Order] Creating new BusinessSettings');
        settings = await BusinessSettings.create({
          shopName: 'Juicy',
          currentOrderNo: 0
        });
      }

      const nextOrderNo = (settings.currentOrderNo || 0) + 1;
      this.orderNo = `ORD${String(nextOrderNo).padStart(5, '0')}`;
      console.log('[Order] Generated order number:', this.orderNo);

      settings.currentOrderNo = nextOrderNo;
      await settings.save();
      console.log('[Order] Updated currentOrderNo to:', nextOrderNo);

      next();
    } catch (error) {
      console.error('[Order] Pre-save hook error:', error);
      next(error);
    }
  } else {
    next();
  }
});

// Indexes for better query performance
orderSchema.index({ orderStatus: 1, orderDate: -1 });
orderSchema.index({ table: 1, orderStatus: 1 });
orderSchema.index({ userId: 1, orderDate: -1 });

// Virtual for total duration
orderSchema.virtual('duration').get(function() {
  if (this.completionTime) {
    return this.completionTime.getTime() - this.startTime.getTime();
  }
  return Date.now() - this.startTime.getTime();
});

// Virtual for formatted duration
orderSchema.virtual('durationFormatted').get(function() {
  const ms = this.duration;
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
});

module.exports = mongoose.model('Order', orderSchema);
