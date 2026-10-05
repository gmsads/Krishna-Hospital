import { OPRecord } from './op-record.model.js';

export const generateNextRegNo = async (branch) => {
  const query = branch && branch !== 'All' ? { branch: new RegExp(`^${branch.trim()}$`, 'i') } : {};
  const count = await OPRecord.countDocuments(query);
  return `Reg-2026-${String(count + 1).padStart(4, '0')}`;
};

export const createOPRecord = async (recordData) => {
  const branchToUse = recordData.branch || '';
  const branchCodeToUse = recordData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');

  let regNoToUse = recordData.regNo || recordData.opNumber || recordData.id;

  if (!regNoToUse || regNoToUse.length < 5 || regNoToUse.includes('OPD-')) {
    regNoToUse = await generateNextRegNo(branchToUse);
  }
  const grossChargesVal = parseFloat(String(recordData.grossCharges || recordData.charges || '300').replace(/[^0-9.]/g, '')) || 300;
  const discountVal = parseFloat(String(recordData.discount || '0').replace(/[^0-9.]/g, '')) || 0;
  const netVal = Math.max(0, grossChargesVal - discountVal);
  const collectedVal = parseFloat(String(recordData.paidAmount ?? recordData.amountPaid ?? netVal).replace(/[^0-9.]/g, '')) || 0;
  const dueVal = Math.max(0, netVal - collectedVal);
  const statusToSet = recordData.paymentStatus || (dueVal <= 0 ? 'Paid' : collectedVal > 0 ? 'Partial' : 'Pending');

  const newRecord = await OPRecord.create({
    regNo: regNoToUse,
    recordType: recordData.recordType || 'OP',
    ipCareDetails: recordData.ipCareDetails || '',
    surgeryName: recordData.surgeryName || '',
    regDate: recordData.regDate || new Date().toISOString().split('T')[0],
    regTime: recordData.regTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    patientName: recordData.patientName.trim(),
    gender: recordData.gender || 'Male',
    age: recordData.age || '30',
    dob: recordData.dob || '',
    address: recordData.address || '',
    phone: recordData.phone.trim(),
    temp: recordData.temp || '98.6',
    weight: recordData.weight || '68',
    height: recordData.height || '170',
    bloodGroup: recordData.bloodGroup || 'O+',
    bp: recordData.bp || '120/80',
    department: recordData.department || 'General Medicine',
    doctor: recordData.doctor || 'Dr. Unassigned',
    referralDoctor: recordData.referralDoctor || '',
    visitValidity: recordData.visitValidity || '15',
    refCommPercent: recordData.refCommPercent || '0',
    charges: grossChargesVal.toString(),
    discount: discountVal,
    netAmount: netVal,
    paymentMethod: recordData.paymentMethod || 'Cash',
    amountPaid: collectedVal.toString(),
    paidAmount: collectedVal,
    paymentStatus: statusToSet,
    upiTxnId: recordData.upiTxnId || '',
    receiptImage: recordData.receiptImage || '',
    branch: branchToUse,
    branchCode: branchCodeToUse,
  });

  return newRecord;
};

export const getAllOPRecords = async (branchFilter = null) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }
  return await OPRecord.find(query).sort({ createdAt: -1 });
};

import mongoose from 'mongoose';

export const getOPRecordById = async (id) => {
  let record = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    record = await OPRecord.findById(id);
  }
  if (!record) {
    record = await OPRecord.findOne({ $or: [{ regNo: id }, { opNumber: id }] });
  }
  return record;
};

export const updateOPRecord = async (id, updateData) => {
  let record = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    record = await OPRecord.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }
  if (!record) {
    record = await OPRecord.findOneAndUpdate({ $or: [{ regNo: id }, { opNumber: id }] }, updateData, { new: true, runValidators: true });
  }
  return record;
};

export const deleteOPRecord = async (id) => {
  let record = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    record = await OPRecord.findByIdAndDelete(id);
  }
  if (!record) {
    record = await OPRecord.findOneAndDelete({ $or: [{ regNo: id }, { opNumber: id }] });
  }
  return record;
};
