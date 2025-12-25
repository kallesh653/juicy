const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
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
  itemName: String,
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unit: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  itemTotal: {
    type: Number,
    required: true
  },
  costPrice: {
    type: Number,
    default: 0
  }
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNo: {
    type: Number,
    unique: true
  },
  billDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  items: [billItemSchema],
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
    default: 0
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  roundOff: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Mixed'],
    default: 'Cash'
  },
  paymentDetails: {
    cash: { type: Number, default: 0 },
    upi: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    upiRefNo: String,
    cardRefNo: String
  },
  status: {
    type: String,
    enum: ['Completed', 'Cancelled', 'Returned'],
    default: 'Completed'
  },
  remarks: String,
  isPrinted: {
    type: Boolean,
    default: false
  },
  printedAt: Date
}, {
  timestamps: true
});

// Indexes
billSchema.index({ billNo: 1 });
billSchema.index({ billDate: -1 });
billSchema.index({ userId: 1 });
billSchema.index({ status: 1 });

// Auto-generate bill number
billSchema.pre('save', async function(next) {
  if (!this.billNo && this.isNew) {
    const lastBill = await mongoose.model('Bill').findOne().sort({ billNo: -1 });
    this.billNo = lastBill ? lastBill.billNo + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
