import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateBranchInput } from './branch.validation.js';
import * as branchService from './branch.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateBranchInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const branch = await branchService.createBranch(req.body);
  return ApiResponse.success(res, branch, 'Branch created successfully', 201);
});

export const getBranches = asyncHandler(async (req, res) => {
  const branches = await branchService.getAllBranches();
  return ApiResponse.success(res, branches, 'Branches fetched successfully', 200);
});

export const getBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.getBranchById(req.params.id);
  return ApiResponse.success(res, branch, 'Branch details fetched successfully', 200);
});

export const update = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req.params.id, req.body);
  return ApiResponse.success(res, branch, 'Branch updated successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await branchService.deleteBranch(req.params.id);
  return ApiResponse.success(res, null, 'Branch deleted successfully', 200);
});
