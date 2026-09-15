import mongoose from 'mongoose';

const labServiceSchema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Lab test service name is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General Pathology',
      trim: true,
    },
    description: {
      type: String,
      default: 'Pathology laboratory diagnostic test',
    },
    rate: {
      type: String,
      required: [true, 'Test rate is required'],
      default: '350.00',
    },
    sampleType: {
      type: String,
      default: 'Blood (EDTA)',
    },
    turnaroundTime: {
      type: String,
      default: '4 Hours',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
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

export const LabService = mongoose.model('LabService', labServiceSchema);
