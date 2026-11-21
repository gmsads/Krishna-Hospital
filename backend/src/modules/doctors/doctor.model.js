import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Doctor full name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    licenseNo: {
      type: String,
      default: 'KMC-REG',
      trim: true,
    },
    qualification: {
      type: String,
      default: 'MBBS',
    },
    experience: {
      type: String,
      default: '5 Years',
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
    shift: {
      type: String,
      default: 'Morning OPD (08:00 AM - 02:00 PM)',
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'On leave', 'Inactive'],
      default: 'Active',
    },
    leaveReason: {
      type: String,
      default: '',
    },
    salary: {
      type: String,
      default: '₹ 85,000',
    },
    password: {
      type: String,
      default: 'Doc@123',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1594824813566-78a9a3b68078?auto=format&fit=crop&q=80&w=400',
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

export const Doctor = mongoose.model('Doctor', doctorSchema);
