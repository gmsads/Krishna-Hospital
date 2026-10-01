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
    subCategories: Array.isArray(serviceData.subCategories) ? serviceData.subCategories : [],
  });

  return newService;
};

export const seedInitialLabServicesIfEmpty = async () => {
  const count = await LabService.countDocuments();
  if (count > 0) return;

  const initialServices = [
    {
      serviceId: 'SRV-0001',
      name: 'Thyroid Function Profile',
      category: 'Endocrinology',
      description: 'Comprehensive Thyroid Panel test for T1, T2, FT3, FT4, and TSH levels',
      rate: '1200.00',
      branch: 'Central Campus',
      branchCode: 'HQ-CENTRAL',
      subCategories: [
        { name: 'Thyroid T1 (Monoiodothyronine)', normalRange: '0.8 - 1.8 ng/mL' },
        { name: 'Thyroid T2 (Diiodothyronine)', normalRange: '1.0 - 2.2 ng/mL' },
        { name: 'Triiodothyronine (T3)', normalRange: '0.8 - 2.0 ng/mL' },
        { name: 'Thyroxine (T4)', normalRange: '5.1 - 14.1 ug/dL' },
        { name: 'TSH (Serum)', normalRange: '0.45 - 4.5 mIU/L' },
      ],
    },
    {
      serviceId: 'SRV-0002',
      name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      description: 'Automated 5-Part Cell Counter CBC panel with Hb, WBC, and Platelets',
      rate: '450.00',
      branch: 'Central Campus',
      branchCode: 'HQ-CENTRAL',
      subCategories: [
        { name: 'Hemoglobin (Hb)', normalRange: '13.0 - 17.0 g/dL' },
        { name: 'Total Leukocyte Count (WBC)', normalRange: '4,000 - 11,000 /uL' },
        { name: 'Platelet Count', normalRange: '1.5 - 4.5 Lakhs /uL' },
      ],
    },
    {
      serviceId: 'SRV-0003',
      name: 'Lipid Profile Complete',
      category: 'Biochemistry',
      description: 'Total Cholesterol, Triglycerides, HDL, and LDL Fractionation',
      rate: '850.00',
      branch: 'Central Campus',
      branchCode: 'HQ-CENTRAL',
      subCategories: [
        { name: 'Serum Cholesterol (Total)', normalRange: '< 200 mg/dL' },
        { name: 'Triglycerides', normalRange: '< 150 mg/dL' },
        { name: 'HDL Cholesterol', normalRange: '> 40 mg/dL' },
        { name: 'LDL Cholesterol', normalRange: '< 100 mg/dL' },
      ],
    },
  ];

  await LabService.insertMany(initialServices);
};

export const getAllLabServices = async (branchFilter = null) => {
  await seedInitialLabServicesIfEmpty();
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
