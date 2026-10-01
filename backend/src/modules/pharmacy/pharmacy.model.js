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
    createdByEmail: {
      type: String,
      default: '',
    },
    creatorRole: {
      type: String,
      default: 'Pharmacist',
    },
    // Pharmacy Credit Fields (Taken from Supplier vs Given to Customer)
    creditType: {
      type: String,
      enum: ['None', 'Taken', 'Given'],
      default: 'None',
    },
    partyName: {
      type: String,
      default: '',
      trim: true,
    },
    partyPhone: {
      type: String,
      default: '',
      trim: true,
    },
    creditAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: String,
      default: '',
    },
    creditStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Settled'],
      default: 'Pending',
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
