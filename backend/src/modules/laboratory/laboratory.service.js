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

    const grossVal = parseFloat(String(orderData.grossFee || orderData.testFee || orderData.amount || '1200').replace(/[^0-9.]/g, '')) || 1200;
    const discountVal = parseFloat(String(orderData.discount || '0').replace(/[^0-9.]/g, '')) || 0;
    const feeVal = Math.max(0, grossVal - discountVal);
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
      grossFee: grossVal,
      discount: discountVal,
      testFee: feeVal.toString(),
      amount: feeVal,
      amountPaid: paidVal.toString(),
      paidAmount: paidVal,
      dueBalance: dueVal,
      paymentStatus: payStat,
      paymentMethod: orderData.paymentMethod || 'Cash',
      upiTxnId: orderData.upiTxnId || '',
      status: orderData.status || 'Sample Collected',
      clinicalNotes: orderData.clinicalNotes || orderData.notes || '',
      notes: orderData.notes || orderData.clinicalNotes || '',
      result: orderData.result || orderData.results?.summaryResult || orderData.results?.result || '',
      testRows: Array.isArray(orderData.testRows) ? orderData.testRows : (orderData.results?.testRows || []),
      results: orderData.results || {
        testRows: Array.isArray(orderData.testRows) ? orderData.testRows : [],
        summaryResult: orderData.result || '',
      },
      createdBy: orderData.createdBy || 'Doctor',
      assignedFrom: orderData.assignedFrom || (['Admin', 'Super Admin', 'Front Desk', 'Hospital'].includes(orderData.createdBy) ? 'Hospital' : orderData.createdBy === 'Lab Assistant' ? 'Lab' : 'Doctor'),
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
  const { _id, __v, ...dataToUpdate } = updateData;

  if (dataToUpdate.notes && !dataToUpdate.clinicalNotes) {
    dataToUpdate.clinicalNotes = dataToUpdate.notes;
  }
  if (dataToUpdate.clinicalNotes && !dataToUpdate.notes) {
    dataToUpdate.notes = dataToUpdate.clinicalNotes;
  }
  if (dataToUpdate.testRows && (!dataToUpdate.results || !dataToUpdate.results.testRows)) {
    dataToUpdate.results = {
      ...(dataToUpdate.results || {}),
      testRows: dataToUpdate.testRows,
      summaryResult: dataToUpdate.result || '',
    };
  }

  if (mongoose.Types.ObjectId.isValid(id)) {
    order = await Laboratory.findByIdAndUpdate(id, dataToUpdate, { new: true, runValidators: true });
  }
  if (!order) {
    order = await Laboratory.findOneAndUpdate(
      { $or: [{ labOrderNo: id }, { testId: id }, { opNumber: id }] },
      dataToUpdate,
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
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    order = await Laboratory.findByIdAndDelete(id);
  }
  if (!order) {
    const escaped = (id || '').trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    order = await Laboratory.findOneAndDelete({
      $or: [
        { labOrderNo: id },
        { testId: id },
        { opNumber: id },
        { labOrderNo: new RegExp(`^${escaped}$`, 'i') },
      ],
    });
  }
  return order;
};
