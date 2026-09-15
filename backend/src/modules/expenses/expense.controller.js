import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateExpenseInput } from './expense.validation.js';
import * as expenseService from './expense.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateExpenseInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  // Attach creator metadata if user is authenticated
  if (req.user) {
    if (!req.body.createdByEmail) req.body.createdByEmail = req.user.email;
    if (!req.body.creatorRole) req.body.creatorRole = req.user.role;
    if (!req.body.createdBy) req.body.createdBy = `${req.user.full_name || 'Staff Member'} (${req.user.role || 'Staff'})`;
    if (!req.body.branch && req.user.branch && req.user.branch !== 'All') {
      req.body.branch = req.user.branch;
      req.body.branchCode = req.user.branchCode;
    }
  }

  const newExpense = await expenseService.createExpense(req.body);
  return ApiResponse.success(res, newExpense, 'Expense recorded successfully', 201);
});

export const getNextExpenseNo = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const nextNo = await expenseService.generateNextExpenseNo(branchFilter);
  return ApiResponse.success(res, { nextExpenseNo: nextNo }, 'Next Expense Number generated successfully', 200);
});

export const getExpenses = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const userEmail = req.user ? req.user.email : null;
  const userRole = req.user ? req.user.role : null;

  const expenses = await expenseService.getAllExpenses(branchFilter, userEmail, userRole);
  return ApiResponse.success(res, expenses, 'Expenses fetched successfully', 200);
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  return ApiResponse.success(res, expense, 'Expense details fetched successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await expenseService.deleteExpenseById(req.params.id);
  return ApiResponse.success(res, null, 'Expense deleted successfully', 200);
});
