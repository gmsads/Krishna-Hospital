import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateOPRecordInput } from './op-record.validation.js';
import * as opRecordService from './op-record.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateOPRecordInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const newRecord = await opRecordService.createOPRecord(req.body);
  return ApiResponse.success(res, newRecord, 'OP record registered successfully', 201);
});

export const getNextRegNo = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const nextNo = await opRecordService.generateNextRegNo(branchFilter);
  return ApiResponse.success(res, { nextRegNo: nextNo }, 'Next Registration Number generated successfully', 200);
});

export const getOPRecords = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const records = await opRecordService.getAllOPRecords(branchFilter);
  return ApiResponse.success(res, records, 'OP records fetched successfully', 200);
});

export const getOPRecord = asyncHandler(async (req, res) => {
  const record = await opRecordService.getOPRecordById(req.params.id);
  return ApiResponse.success(res, record, 'OP record details fetched successfully', 200);
});

export const update = asyncHandler(async (req, res) => {
  const record = await opRecordService.updateOPRecord(req.params.id, req.body);
  return ApiResponse.success(res, record, 'OP record updated successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await opRecordService.deleteOPRecord(req.params.id);
  return ApiResponse.success(res, null, 'OP record deleted successfully', 200);
});
