import mongoose from 'mongoose';
import { Pharmacy } from './pharmacy.model.js';

export const generateNextSaleNo = async (branch) => {
  const query = branch && branch !== 'All' ? { branch: new RegExp(`^${branch.trim()}$`, 'i') } : {};
  const count = await Pharmacy.countDocuments(query);
  return `PHARM-${String(count + 1).padStart(4, '0')}`;
};

export const createPharmacySale = async (saleData) => {
  const branchToUse = saleData.branch || '';
  const branchCodeToUse = saleData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');

  let saleNoToUse = saleData.saleNo || saleData.id;

  if (!saleNoToUse || saleNoToUse.length < 5 || !saleNoToUse.includes('PHARM-')) {
    saleNoToUse = await generateNextSaleNo(branchToUse);
  }

  const collectingVal = parseFloat(String(saleData.collectingAmount || '0').replace(/[^0-9.]/g, '')) || 0;
  const collectionVal = parseFloat(String(saleData.totalCollection || collectingVal).replace(/[^0-9.]/g, '')) || collectingVal;
  const expenseVal = parseFloat(String(saleData.totalExpense || '0').replace(/[^0-9.]/g, '')) || 0;
  const purchaseVal = parseFloat(String(saleData.totalPurchase || '0').replace(/[^0-9.]/g, '')) || 0;

  const newSale = await Pharmacy.create({
    saleNo: saleNoToUse,
    patientName: saleData.patientName ? saleData.patientName.trim() : 'Walk-In Customer',
    collectingAmount: collectingVal,
    totalCollection: collectionVal,
    totalExpense: expenseVal,
    totalPurchase: purchaseVal,
    paymentMethod: saleData.paymentMethod || 'Cash',
    upiTxnId: saleData.upiTxnId || '',
    notes: saleData.notes || '',
    status: saleData.status || 'Completed',
    createdBy: saleData.createdBy || 'Pharmacist',
    createdByEmail: saleData.createdByEmail || '',
    creatorRole: saleData.creatorRole || 'Pharmacist',
    creditType: saleData.creditType || 'None',
    partyName: saleData.partyName || saleData.patientName || '',
    partyPhone: saleData.partyPhone || saleData.phone || '',
    creditAmount: saleData.creditAmount || (saleData.creditType !== 'None' ? collectingVal : 0),
    paidAmount: saleData.paidAmount || 0,
    dueDate: saleData.dueDate || '',
    creditStatus: saleData.creditStatus || 'Pending',
    branch: branchToUse,
    branchCode: branchCodeToUse,
  });

  return newSale;
};

export const settlePharmacyCredit = async (id, payload = null) => {
  let sale = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    sale = await Pharmacy.findById(id);
  }
  if (!sale) {
    sale = await Pharmacy.findOne({ saleNo: id });
  }
  if (!sale) throw new Error('Pharmacy record not found');

  const fullCredit = sale.creditAmount || sale.collectingAmount || 0;
  let newPaid = fullCredit;
  let paymentMethod = null;
  let upiTxnId = null;
  let receiptImage = null;
  let paymentHistory = null;
  let splitBreakdown = null;
  let paymentDate = null;

  if (typeof payload === 'object' && payload !== null) {
    if (payload.paidAmount !== undefined) newPaid = Number(payload.paidAmount);
    if (payload.paymentMethod) paymentMethod = payload.paymentMethod;
    if (payload.paymentDate) paymentDate = payload.paymentDate;
    if (payload.lastPaymentDate) paymentDate = payload.lastPaymentDate;
    if (payload.upiTxnId !== undefined) upiTxnId = payload.upiTxnId;
    if (payload.receiptImage !== undefined) receiptImage = payload.receiptImage;
    if (payload.paymentHistory !== undefined) paymentHistory = payload.paymentHistory;
    if (payload.splitBreakdown !== undefined) splitBreakdown = payload.splitBreakdown;
  } else if (payload !== null) {
    newPaid = Number(payload);
  }

  const isSettled = newPaid >= fullCredit;

  sale.paidAmount = newPaid;
  sale.creditStatus = isSettled ? 'Settled' : 'Partial';
  if (paymentMethod) sale.paymentMethod = paymentMethod;
  if (paymentDate) {
    sale.paymentDate = paymentDate;
    sale.lastPaymentDate = paymentDate;
  }
  if (upiTxnId !== null) sale.upiTxnId = upiTxnId;
  if (receiptImage !== null) sale.receiptImage = receiptImage;
  if (paymentHistory) sale.paymentHistory = paymentHistory;
  if (splitBreakdown) sale.splitBreakdown = splitBreakdown;

  return await sale.save();
};

export const getAllPharmacySales = async (branchFilter = null) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }
  return await Pharmacy.find(query).sort({ createdAt: -1 });
};

export const getPharmacySaleById = async (id) => {
  let sale = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    sale = await Pharmacy.findById(id);
  }
  if (!sale) {
    sale = await Pharmacy.findOne({ $or: [{ saleNo: id }, { referenceNo: id }] });
  }
  return sale;
};

export const deletePharmacySale = async (id) => {
  let sale = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    sale = await Pharmacy.findByIdAndDelete(id);
  }
  if (!sale) {
    sale = await Pharmacy.findOneAndDelete({ $or: [{ saleNo: id }, { referenceNo: id }] });
  }
  return sale;
};
