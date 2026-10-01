import mongoose from 'mongoose';

const labInventorySchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['Consumable', 'Machine'],
      default: 'Consumable',
      required: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Kits & Reagents',
      trim: true,
    },
    // For Consumables & Test Kits
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    alertThreshold: {
      type: Number,
      default: 10,
      min: [1, 'Alert threshold must be at least 1'],
    },
    unit: {
      type: String,
      default: 'Kits',
      trim: true,
    },
    // Spent Amount / Cost Tracking
    unitCost: {
      type: Number,
      default: 0,
      min: [0, 'Unit cost cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
    // For Machines & Equipment
    modelSerialNo: {
      type: String,
      default: '',
      trim: true,
    },
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },
    machineStatus: {
      type: String,
      enum: ['Active', 'Under Maintenance', 'Calibration Due', 'Out of Service'],
      default: 'Active',
    },
    lastMaintenanceDate: {
      type: String,
      default: '',
    },
    nextMaintenanceDate: {
      type: String,
      default: '',
    },
    // Scoping
    branch: {
      type: String,
      default: 'Central Campus',
      trim: true,
    },
    branchCode: {
      type: String,
      default: 'HQ-CENTRAL',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    lastUsedBy: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LabInventoryItem = mongoose.model('LabInventoryItem', labInventorySchema);
