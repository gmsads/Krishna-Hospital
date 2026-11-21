import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateStaffInput } from './staff.validation.js';
import * as staffService from './staff.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateStaffInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const newStaff = await staffService.createStaff(req.body);
  return ApiResponse.success(res, newStaff, 'Staff member added successfully', 201);
});

export const getNextEmpId = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const nextId = await staffService.generateNextEmpId(branchFilter);
  return ApiResponse.success(res, { nextEmpId: nextId }, 'Next Employee ID generated successfully', 200);
});

export const getStaffMembers = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const staffList = await staffService.getAllStaff(branchFilter);
  return ApiResponse.success(res, staffList, 'Staff list fetched successfully', 200);
});

export const getStaff = asyncHandler(async (req, res) => {
  const member = await staffService.getStaffById(req.params.id);
  return ApiResponse.success(res, member, 'Staff member details fetched successfully', 200);
});

export const update = asyncHandler(async (req, res) => {
  const member = await staffService.updateStaff(req.params.id, req.body);
  return ApiResponse.success(res, member, 'Staff member updated successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await staffService.deleteStaff(req.params.id);
  return ApiResponse.success(res, null, 'Staff member deleted successfully', 200);
});
