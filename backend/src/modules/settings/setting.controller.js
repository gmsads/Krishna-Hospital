import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as settingService from './setting.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const branchKey = req.query.branch || 'Global';
  const allMap = await settingService.getAllSettingsMap();
  const current = await settingService.getSettings(branchKey);

  return ApiResponse.success(
    res,
    { current, allMap },
    'Hospital settings and branding retrieved from MongoDB successfully',
    200
  );
});

export const updateSettings = asyncHandler(async (req, res) => {
  const branchKey = req.query.branch || req.body.branchKey || 'Global';
  const updated = await settingService.updateSettings(branchKey, req.body);

  return ApiResponse.success(
    res,
    updated,
    'Hospital settings and branding updated in MongoDB successfully',
    200
  );
});
