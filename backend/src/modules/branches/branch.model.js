import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    location: {
      type: String,
      required: [true, 'Branch location is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 98000 00000',
    },
    email: {
      type: String,
      required: [true, 'Branch email is required'],
      trim: true,
      lowercase: true,
    },
    adminName: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

export const Branch = mongoose.model('Branch', branchSchema);
