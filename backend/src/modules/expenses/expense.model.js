import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseNo: {
      type: String,
      required: true,
      trim: true,
    },
    referenceNo: {
      type: String,
      default: '',
      trim: true,
    },
    billNo: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Medical & Lab Supplies',
        'Office & Front Desk',
        'Utilities & Maintenance',
        'Staff & Operations',
        'Pharmacy Expenses',
        'General Expenses',
      ],
      default: 'Medical & Lab Supplies',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount must be greater than or equal to 0'],
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Credit / Debit Card', 'Bank Transfer'],
      default: 'Cash',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: String,
      default: 'Staff Member',
      trim: true,
    },
    createdByEmail: {
      type: String,
      default: '',
      trim: true,
    },
    creatorRole: {
      type: String,
      default: 'Staff',
      trim: true,
    },
    branch: {
      type: String,
      default: '',
      trim: true,
    },
    branchCode: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Approved', 'Pending', 'Rejected'],
      default: 'Approved',
    },
  },
  {
    timestamps: true,
  }
);

export const Expense = mongoose.model('Expense', expenseSchema);
