import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateDoctorInput } from './doctor.validation.js';
import * as doctorService from './doctor.service.js';

export const create = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateDoctorInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const newDoc = await doctorService.createDoctor(req.body);
  return ApiResponse.success(res, newDoc, 'Doctor registered successfully', 201);
});

export const getNextDocId = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const nextId = await doctorService.generateNextDocId(branchFilter);
  return ApiResponse.success(res, { nextDocId: nextId }, 'Next Doctor ID generated successfully', 200);
});

export const getDoctors = asyncHandler(async (req, res) => {
  const branchFilter = req.query.branch;
  const docs = await doctorService.getAllDoctors(branchFilter);
  return ApiResponse.success(res, docs, 'Doctors fetched successfully', 200);
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doc = await doctorService.getDoctorById(req.params.id);
  return ApiResponse.success(res, doc, 'Doctor details fetched successfully', 200);
});

export const update = asyncHandler(async (req, res) => {
  const doc = await doctorService.updateDoctor(req.params.id, req.body);
  return ApiResponse.success(res, doc, 'Doctor updated successfully', 200);
});

export const remove = asyncHandler(async (req, res) => {
  await doctorService.deleteDoctor(req.params.id);
  return ApiResponse.success(res, null, 'Doctor deleted successfully', 200);
});
