import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateLabOrderInput } from './laboratory.validation.js';
import * as labService from './laboratory.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateLabOrderInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const newOrder = await labService.createLabOrder(req.body);
  return ApiResponse.success(res, newOrder, 'Lab test order registered successfully', 201);
});

export const getNextLabNo = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const nextNo = await labService.generateNextLabNo(branchFilter);
  return ApiResponse.success(res, { nextLabNo: nextNo }, 'Next Lab Order Number generated successfully', 200);
});

export const getLabOrders = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const orders = await labService.getAllLabOrders(branchFilter);
  return ApiResponse.success(res, orders, 'Lab orders fetched successfully', 200);
});

export const getLabOrder = asyncHandler(async (req, res) => {
  const order = await labService.getLabOrderById(req.params.id);
  return ApiResponse.success(res, order, 'Lab order details fetched successfully', 200);
});

export const update = asyncHandler(async (req, res) => {
  const order = await labService.updateLabOrder(req.params.id, req.body);
  return ApiResponse.success(res, order, 'Lab order updated successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await labService.deleteLabOrder(req.params.id);
  return ApiResponse.success(res, null, 'Lab order deleted successfully', 200);
});
