import { LabService } from './lab-service.model.js';

export const generateNextServiceId = async () => {
  const count = await LabService.countDocuments();
  return `SRV-${String(count + 1).padStart(4, '0')}`;
};

export const createLabService = async (serviceData) => {
  let srvIdToUse = serviceData.serviceId || serviceData.id;

  if (!srvIdToUse || srvIdToUse.length < 4 || srvIdToUse.includes('Math')) {
    srvIdToUse = await generateNextServiceId();
  }

  const branchToUse = serviceData.branch || '';
  const branchCodeToUse = serviceData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');

  const newService = await LabService.create({
    serviceId: srvIdToUse,
    name: serviceData.name.trim(),
    category: serviceData.category || 'General Pathology',
    description: serviceData.description || 'Pathology laboratory diagnostic test',
    rate: parseFloat(serviceData.rate || '350').toFixed(2),
    sampleType: serviceData.sampleType || 'Blood (EDTA)',
    turnaroundTime: serviceData.turnaroundTime || '4 Hours',
    status: serviceData.status || 'Active',
    branch: branchToUse,
    branchCode: branchCodeToUse,
  });

  return newService;
};

export const getAllLabServices = async (branchFilter = null) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }
  return await LabService.find(query).sort({ createdAt: -1 });
};

export const getLabServiceById = async (id) => {
  const srv = await LabService.findById(id);
  if (!srv) {
    throw new Error('Lab service not found');
  }
  return srv;
};

export const updateLabService = async (id, updateData) => {
  const srv = await LabService.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!srv) {
    throw new Error('Lab service not found');
  }
  return srv;
};

export const deleteLabService = async (id) => {
  const srv = await LabService.findByIdAndDelete(id);
  if (!srv) {
    throw new Error('Lab service not found');
  }
  return srv;
};
