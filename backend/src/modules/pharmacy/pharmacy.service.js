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
    branch: branchToUse,
    branchCode: branchCodeToUse,
  });

  return newSale;
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
