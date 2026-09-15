import mongoose from 'mongoose';

const opRecordSchema = new mongoose.Schema(
  {
    regNo: {
      type: String,
      required: true,
      trim: true,
    },
    recordType: {
      type: String,
      enum: ['OP', 'IP', 'Emergency'],
      default: 'OP',
    },
    ipCareDetails: {
      type: String,
      default: '',
    },
    regDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    regTime: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    gender: {
      type: String,
      default: 'Male',
    },
    age: {
      type: String,
      default: '30',
    },
    dob: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Patient phone number is required'],
      trim: true,
    },
    // Vitals
    temp: { type: String, default: '98.6' },
    weight: { type: String, default: '68' },
    height: { type: String, default: '170' },
    bloodGroup: { type: String, default: 'O+' },
    bp: { type: String, default: '120/80' },
    // Doctor & Department
    department: { type: String, default: 'General Medicine' },
    doctor: { type: String, default: 'Dr. Meera Nair' },
    referralDoctor: { type: String, default: '' },
    visitValidity: { type: String, default: '15' },
    refCommPercent: { type: String, default: '0' },
    charges: { type: String, default: '300.00' },
    // Payment
    paymentMethod: { type: String, default: 'Cash' },
    amountPaid: { type: String, default: '300.00' },
    paidAmount: { type: Number, default: 300 },
    paymentStatus: { type: String, default: 'Paid' },
    upiTxnId: { type: String, default: '' },
    receiptImage: { type: String, default: '' },
    // Multi-tenant Branch Scoping
    branch: { type: String, default: '' },
    branchCode: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const OPRecord = mongoose.model('OPRecord', opRecordSchema);
