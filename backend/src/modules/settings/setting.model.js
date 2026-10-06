import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    branchKey: {
      type: String,
      default: 'Global',
      trim: true,
    },
    hospitalName: {
      type: String,
      default: 'KRISHNA HOSPITALS',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Healthcare Excellence for Every Family',
      trim: true,
    },
    registrationNo: {
      type: String,
      default: 'HOSP-KMC-984021',
      trim: true,
    },
    gstin: {
      type: String,
      default: '32AAAAA0000A1Z5',
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 98470 00000',
      trim: true,
    },
    email: {
      type: String,
      default: 'contact@krishnahospital.org',
      trim: true,
    },
    address: {
      type: String,
      default: 'House 14, MG Road, Central Campus, Central City',
      trim: true,
    },
    footerNote: {
      type: String,
      default: 'Emergency Contact: 108 / +91 98470 00000 | Prescription valid for 7 days from date of issue.',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=300',
    },
    watermark: {
      type: String,
      default: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300',
    },
    upiHandles: {
      type: [String],
      default: ['krishnahospital@okicici', 'krishnalab@ybl', 'krishnaglobal@hdfcbank'],
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model('Setting', settingSchema);
