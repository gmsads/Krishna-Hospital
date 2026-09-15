import { Expense } from './expense.model.js';

export const generateNextExpenseNo = async (branch) => {
  const query = branch && branch !== 'All' ? { branch: new RegExp(`^${branch.trim()}$`, 'i') } : {};
  const count = await Expense.countDocuments(query);
  return `BILL-${String(count + 1).padStart(5, '0')}`;
};

export const createExpense = async (expenseData) => {
  const branchToUse = expenseData.branch || '';
  const branchCodeToUse = expenseData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');

  let billNoToUse = expenseData.billNo || expenseData.referenceNo || expenseData.expenseNo || expenseData.id;
  if (!billNoToUse || billNoToUse.length < 5 || !billNoToUse.includes('BILL-')) {
    billNoToUse = await generateNextExpenseNo(branchToUse);
  }

  const amountVal = parseFloat(String(expenseData.amount || '0').replace(/[^0-9.]/g, '')) || 0;

  const newExpense = await Expense.create({
    expenseNo: billNoToUse,
    referenceNo: billNoToUse,
    billNo: billNoToUse,
    title: expenseData.title.trim(),
    category: expenseData.category || 'Medical & Lab Supplies',
    amount: amountVal,
    date: expenseData.date || new Date().toISOString().split('T')[0],
    paymentMethod: expenseData.paymentMethod || 'Cash',
    notes: expenseData.notes ? expenseData.notes.trim() : '',
    createdBy: expenseData.createdBy ? expenseData.createdBy.trim() : 'Staff Member',
    createdByEmail: expenseData.createdByEmail ? expenseData.createdByEmail.trim().toLowerCase() : '',
    creatorRole: expenseData.creatorRole || 'Staff',
    branch: branchToUse,
    branchCode: branchCodeToUse,
    status: expenseData.status || 'Approved',
  });

  return newExpense;
};

export const getAllExpenses = async (branchFilter = null, userEmail = null, userRole = null) => {
  const query = {};

  // 1. Branch Scoping: Filter by branch if specified and not 'All'
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }

  // 2. Creator Scoping for Staff roles if restricted
  if (userRole && userRole !== 'Super Admin' && userRole !== 'Admin') {
    if (userEmail) {
      query.createdByEmail = userEmail.toLowerCase().trim();
    }
  }

  return await Expense.find(query).sort({ createdAt: -1 });
};

import mongoose from 'mongoose';

export const getExpenseById = async (id) => {
  let expense = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    expense = await Expense.findById(id);
  }
  if (!expense) {
    expense = await Expense.findOne({ $or: [{ expenseNo: id }, { referenceNo: id }, { billNo: id }] });
  }
  return expense;
};

export const deleteExpenseById = async (id) => {
  let expense = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    expense = await Expense.findByIdAndDelete(id);
  }
  if (!expense) {
    expense = await Expense.findOneAndDelete({ $or: [{ expenseNo: id }, { referenceNo: id }, { billNo: id }] });
  }
  return expense;
};
