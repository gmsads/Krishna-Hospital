import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    empId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Staff full name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Staff role is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'General Operations',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    salary: {
      type: String,
      default: '₹ 30,000',
    },
    shift: {
      type: String,
      default: 'Day Shift (08:00 AM - 04:00 PM)',
    },
    qualification: {
      type: String,
      default: 'Graduate',
    },
    experience: {
      type: String,
      default: '3 Years',
    },
    status: {
      type: String,
      enum: ['Active', 'On leave', 'Inactive'],
      default: 'Active',
    },
    leaveReason: {
      type: String,
      default: '',
    },
    dateJoined: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    password: {
      type: String,
      default: 'Staff@123',
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

export const Staff = mongoose.model('Staff', staffSchema);
