import mongoose from 'mongoose';
import { Laboratory } from './laboratory.model.js';

export const generateNextLabNo = async (branch) => {
  const query = branch && branch !== 'All' ? { branch: new RegExp(`^${branch.trim()}$`, 'i') } : {};
  const count = await Laboratory.countDocuments(query);
  return `LAB-${String(count + 1).padStart(4, '0')}`;
};

export const createLabOrder = async (orderData) => {
  const branchToUse = orderData.branch || '';
  const branchCodeToUse = orderData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');

  let labOrderNoToUse = orderData.labOrderNo || orderData.id || orderData.testId;

  if (!labOrderNoToUse || labOrderNoToUse.length < 3) {
    labOrderNoToUse = await generateNextLabNo(branchToUse);
  }

    const feeVal = parseFloat(String(orderData.testFee || orderData.amount || '1200').replace(/[^0-9.]/g, '')) || 1200;
    const paidVal = parseFloat(String(orderData.amountPaidNow || orderData.amountPaid || orderData.paidAmount || '0').replace(/[^0-9.]/g, '')) || 0;
    const dueVal = typeof orderData.dueBalance === 'number' ? orderData.dueBalance : Math.max(0, feeVal - paidVal);
    const payStat = orderData.paymentStatus || (dueVal <= 0 ? 'Paid' : paidVal > 0 ? 'Partial' : 'Pending');

    const newOrder = await Laboratory.create({
      labOrderNo: labOrderNoToUse,
      opNumber: orderData.opNumber || orderData.opNo || labOrderNoToUse,
      patientName: orderData.patientName ? orderData.patientName.trim() : (orderData.patient || 'Patient'),
      phone: orderData.phone || '',
      doctor: orderData.orderingDoctor || orderData.doctor || 'Self Created / Walk-In',
      testName: orderData.testName ? orderData.testName.trim() : (orderData.test || 'Blood Test'),
      category: orderData.category || 'General Pathology',
      priority: orderData.priority || 'Routine',
      testFee: feeVal.toString(),
      amount: feeVal,
      amountPaid: paidVal.toString(),
      paidAmount: paidVal,
      dueBalance: dueVal,
      paymentStatus: payStat,
      paymentMethod: orderData.paymentMethod || 'Cash',
      upiTxnId: orderData.upiTxnId || '',
      status: orderData.status || 'Sample Collected',
      clinicalNotes: orderData.clinicalNotes || '',
      results: orderData.results || {},
      createdBy: orderData.createdBy || 'Doctor',
      branch: branchToUse,
      branchCode: branchCodeToUse,
    });

  return newOrder;
};

export const getAllLabOrders = async (branchFilter = null) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }
  return await Laboratory.find(query).sort({ createdAt: -1 });
};

export const getLabOrderById = async (id) => {
  const order = await Laboratory.findById(id);
  if (!order) {
    throw new Error('Lab order not found');
  }
  return order;
};

export const updateLabOrder = async (id, updateData) => {
  let order = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    order = await Laboratory.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }
  if (!order) {
    order = await Laboratory.findOneAndUpdate(
      { $or: [{ labOrderNo: id }, { testId: id }] },
      updateData,
      { new: true, runValidators: true }
    );
  }
  if (!order) {
    throw new Error('Lab order not found');
  }
  return order;
};

export const deleteLabOrder = async (id) => {
  let order = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    order = await Laboratory.findByIdAndDelete(id);
  }
  if (!order) {
    order = await Laboratory.findOneAndDelete({ $or: [{ labOrderNo: id }, { testId: id }] });
  }
  return order;
};
