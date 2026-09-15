import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema(
  {
    saleNo: {
      type: String,
      required: true,
      trim: true,
    },
    patientName: {
      type: String,
      default: 'Walk-In Customer',
      trim: true,
    },
    collectingAmount: {
      type: Number,
      required: [true, 'Collecting amount is mandatory'],
    },
    totalCollection: {
      type: Number,
      default: 0,
    },
    totalExpense: {
      type: Number,
      default: 0,
    },
    totalPurchase: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI / Online', 'Credit / Debit Card', 'Bank Transfer'],
      default: 'Cash',
    },
    upiTxnId: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Completed',
    },
    createdBy: {
      type: String,
      default: 'Pharmacist',
    },
    // Multi-tenant Branch Scoping
    branch: {
      type: String,
      default: '',
    },
    branchCode: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
