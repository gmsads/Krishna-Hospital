import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validatePharmacyInput } from './pharmacy.validation.js';
import * as pharmacyService from './pharmacy.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validatePharmacyInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const newSale = await pharmacyService.createPharmacySale(req.body);
  return ApiResponse.success(res, newSale, 'Pharmacy collection registered successfully', 201);
});

export const getNextSaleNo = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const nextNo = await pharmacyService.generateNextSaleNo(branchFilter);
  return ApiResponse.success(res, { nextSaleNo: nextNo }, 'Next Sale Number generated successfully', 200);
});

export const getSales = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const sales = await pharmacyService.getAllPharmacySales(branchFilter);
  return ApiResponse.success(res, sales, 'Pharmacy sales fetched successfully', 200);
});

export const getSale = asyncHandler(async (req, res) => {
  const sale = await pharmacyService.getPharmacySaleById(req.params.id);
  return ApiResponse.success(res, sale, 'Pharmacy sale details fetched successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await pharmacyService.deletePharmacySale(req.params.id);
  return ApiResponse.success(res, null, 'Pharmacy sale record deleted successfully', 200);
});
