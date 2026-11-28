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
    method: serviceData.method ? serviceData.method.trim() : '',
    category: serviceData.category || 'General Pathology',
    description: serviceData.description || 'Pathology laboratory diagnostic test',
    rate: parseFloat(serviceData.rate || '350').toFixed(2),
    sampleType: serviceData.sampleType || 'Blood (EDTA)',
    turnaroundTime: serviceData.turnaroundTime || '4 Hours',
    status: serviceData.status || 'Active',
    branch: branchToUse,
    branchCode: branchCodeToUse,
    subCategories: Array.isArray(serviceData.subCategories) ? serviceData.subCategories : [],
  });

  return newService;
};

export const bulkCreateLabServices = async (items = [], defaultBranch = '', defaultBranchCode = '') => {
  if (!Array.isArray(items) || items.length === 0) {
    return { inserted: [], skippedCount: 0 };
  }

  const allExisting = await LabService.find({}, { serviceId: 1, name: 1, branch: 1 }).lean();
  let maxNum = 0;
  const existingKeys = new Set();
  allExisting.forEach((s) => {
    const m = String(s.serviceId || '').match(/SRV-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
    const key = `${(s.name || '').trim().toLowerCase()}||${(s.branch || '').trim().toLowerCase()}`;
    existingKeys.add(key);
  });

  const docsToInsert = [];
  let skippedCount = 0;
  const seenInBatch = new Set();

  for (const raw of items) {
    const cleanName = String(raw?.name || '').trim();
    if (!cleanName) {
      skippedCount += 1;
      continue;
    }

    const branchToUse = String(raw?.branch || defaultBranch || '').trim();
    const branchCodeToUse = String(
      raw?.branchCode || defaultBranchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '')
    ).trim();

    const dedupeKey = `${cleanName.toLowerCase()}||${branchToUse.toLowerCase()}`;
    if (existingKeys.has(dedupeKey) || seenInBatch.has(dedupeKey)) {
      skippedCount += 1;
      continue;
    }
    seenInBatch.add(dedupeKey);

    maxNum += 1;
    const parsedRate = parseFloat(String(raw?.rate ?? '0').replace(/[^0-9.]/g, ''));
    const rateStr = isNaN(parsedRate) ? '0.00' : parsedRate.toFixed(2);
    const codeStr = String(raw?.code || '').trim();
    const descStr = String(raw?.description || '').trim() || (codeStr ? `Code: ${codeStr}` : 'Pathology laboratory diagnostic test');

    docsToInsert.push({
      serviceId: `SRV-${String(maxNum).padStart(4, '0')}`,
      name: cleanName,
      method: String(raw?.method || '').trim(),
      category: String(raw?.category || 'General Pathology').trim(),
      description: descStr,
      rate: rateStr,
      sampleType: String(raw?.sampleType || 'Blood (EDTA)').trim(),
      turnaroundTime: String(raw?.turnaroundTime || '4 Hours').trim(),
      status: String(raw?.status || 'Active').trim(),
      branch: branchToUse,
      branchCode: branchCodeToUse,
      subCategories: Array.isArray(raw?.subCategories) ? raw.subCategories : [],
    });
  }

  const inserted = docsToInsert.length > 0 ? await LabService.insertMany(docsToInsert) : [];
  return { inserted, skippedCount };
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
