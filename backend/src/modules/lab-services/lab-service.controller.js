import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateLabServiceInput } from './lab-service.validation.js';
import * as labServiceService from './lab-service.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateLabServiceInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const newService = await labServiceService.createLabService(req.body);
  return ApiResponse.success(res, newService, 'Lab service added successfully', 201);
});

export const bulkCreate = asyncHandler(async (req, res) => {
  const { items, branch, branchCode } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return ApiResponse.error(res, 'No lab test rows provided for bulk upload', 400);
  }
  const result = await labServiceService.bulkCreateLabServices(items, branch, branchCode);
  return ApiResponse.success(
    res,
    result,
    `Uploaded ${result.inserted.length} lab test(s) successfully${result.skippedCount > 0 ? ` (${result.skippedCount} duplicate/invalid skipped)` : ''}`,
    201
  );
});

export const getNextServiceId = asyncHandler(async (req, res) => {
  const nextId = await labServiceService.generateNextServiceId();
  return ApiResponse.success(res, { nextServiceId: nextId }, 'Next Service ID generated successfully', 200);
});

export const getLabServices = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const services = await labServiceService.getAllLabServices(branchFilter);
  return ApiResponse.success(res, services, 'Lab services fetched successfully', 200);
});

export const getLabService = asyncHandler(async (req, res) => {
  const srv = await labServiceService.getLabServiceById(req.params.id);
  return ApiResponse.success(res, srv, 'Lab service details fetched successfully', 200);
});

export const update = asyncHandler(async (req, res) => {
  const srv = await labServiceService.updateLabService(req.params.id, req.body);
  return ApiResponse.success(res, srv, 'Lab service updated successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await labServiceService.deleteLabService(req.params.id);
  return ApiResponse.success(res, null, 'Lab service deleted successfully', 200);
});
