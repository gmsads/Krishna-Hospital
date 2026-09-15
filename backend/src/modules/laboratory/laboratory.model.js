import mongoose from 'mongoose';

const laboratorySchema = new mongoose.Schema(
  {
    labOrderNo: {
      type: String,
      required: true,
      trim: true,
    },
    opNumber: {
      type: String,
      required: [true, 'OP Registration Number is required'],
      trim: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    doctor: {
      type: String,
      default: 'Dr. Unassigned',
      trim: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'Hematology',
    },
    priority: {
      type: String,
      default: 'Routine',
      trim: true,
    },
    testFee: {
      type: String,
      default: '1200',
    },
    amount: {
      type: Number,
      default: 1200,
    },
    amountPaid: {
      type: String,
      default: '0',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueBalance: {
      type: Number,
      default: 1200,
    },
    paymentStatus: {
      type: String,
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
    },
    upiTxnId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Result ready',
      trim: true,
    },
    clinicalNotes: {
      type: String,
      default: '',
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sampleCollectedAt: {
      type: String,
      default: () => new Date().toLocaleString(),
    },
    completedAt: {
      type: String,
      default: '',
    },
    // Creator & Multi-tenant Branch Scoping
    createdBy: {
      type: String,
      default: 'Doctor',
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

export const Laboratory = mongoose.model('Laboratory', laboratorySchema);
