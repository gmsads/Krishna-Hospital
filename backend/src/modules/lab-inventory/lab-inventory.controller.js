import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as inventoryService from './lab-inventory.service.js';

export const getItems = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  await inventoryService.seedInitialInventoryIfEmpty();
  const items = await inventoryService.getAllInventoryItems(branchFilter);
  return ApiResponse.success(res, items, 'Lab inventory items fetched successfully', 200);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.body.itemName) {
    return ApiResponse.error(res, 'Item name is required', 400);
  }

  if (req.user && !req.body.branch && req.user.branch && req.user.branch !== 'All') {
    req.body.branch = req.user.branch;
    req.body.branchCode = req.user.branchCode;
  }

  const newItem = await inventoryService.createInventoryItem(req.body);
  return ApiResponse.success(res, newItem, 'Inventory item added successfully', 201);
});

export const consume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity = 1 } = req.body;
  const userName = req.user ? req.user.full_name || req.user.role : 'Lab Staff';

  const updatedItem = await inventoryService.consumeStockItem(id, Number(quantity), userName);
  return ApiResponse.success(res, updatedItem, 'Stock consumed successfully', 200);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedItem = await inventoryService.updateInventoryItem(id, req.body);
  return ApiResponse.success(res, updatedItem, 'Inventory item updated successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await inventoryService.deleteInventoryItem(id);
  return ApiResponse.success(res, null, 'Inventory item deleted successfully', 200);
});
