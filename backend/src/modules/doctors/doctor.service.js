import { Doctor } from './doctor.model.js';
import { User } from '../auth/auth.model.js';
import { hashPassword } from '../auth/auth.utils.js';

export const generateNextDocId = async (branch) => {
  const query = branch && branch !== 'All' ? { branch: new RegExp(`^${branch.trim()}$`, 'i') } : {};
  const count = await Doctor.countDocuments(query);
  return `DOC-${String(count + 1).padStart(4, '0')}`;
};

export const createDoctor = async (doctorData) => {
  const branchToUse = doctorData.branch || '';
  const branchCodeToUse = doctorData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');
  const emailToUse = (doctorData.email || `${doctorData.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@krishnahospital.org`).trim().toLowerCase();
  const passwordToUse = doctorData.password || 'Doc@123';

  let docIdToUse = doctorData.docId || doctorData.id;

  if (!docIdToUse || docIdToUse.length < 5 || docIdToUse.includes('usr-')) {
    docIdToUse = await generateNextDocId(branchToUse);
  }

  const newDoctor = await Doctor.create({
    docId: docIdToUse,
    name: doctorData.name.trim(),
    department: doctorData.department.trim(),
    licenseNo: doctorData.licenseNo ? doctorData.licenseNo.trim() : 'KMC-REG',
    qualification: doctorData.qualification || 'MBBS',
    experience: doctorData.experience || '5 Years',
    phone: doctorData.phone.trim(),
    email: emailToUse,
    shift: doctorData.shift || 'Morning OPD (08:00 AM - 02:00 PM)',
    status: doctorData.status || 'Active',
    leaveReason: doctorData.leaveReason || '',
    salary: doctorData.salary || '₹ 85,000',
    password: passwordToUse,
    image: doctorData.image || 'https://images.unsplash.com/photo-1594824813566-78a9a3b68078?auto=format&fit=crop&q=80&w=400',
    branch: branchToUse,
    branchCode: branchCodeToUse,
  });

  // Auto-provision Doctor User Account in Users Collection
  const existingUser = await User.findOne({ email: emailToUse });
  if (!existingUser) {
    const hashedPassword = await hashPassword(passwordToUse);
    await User.create({
      email: emailToUse,
      password: hashedPassword,
      full_name: doctorData.name.trim(),
      role: 'Doctor',
      department: doctorData.department.trim(),
      phone: doctorData.phone.trim(),
      branch: branchToUse,
      branchCode: branchCodeToUse,
    });
  }

  return newDoctor;
};

export const getAllDoctors = async (branchFilter = null) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }
  return await Doctor.find(query).sort({ createdAt: -1 });
};

export const getDoctorById = async (id) => {
  let doc = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    doc = await Doctor.findById(id);
  }
  if (!doc) {
    doc = await Doctor.findOne({ $or: [{ docId: id }, { email: (id || '').toLowerCase() }] });
  }
  if (!doc) {
    throw new Error('Doctor not found');
  }
  return doc;
};

export const updateDoctor = async (id, updateData) => {
  let doc = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    doc = await Doctor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }
  if (!doc) {
    doc = await Doctor.findOneAndUpdate({ $or: [{ docId: id }, { email: (id || '').toLowerCase() }] }, updateData, { new: true, runValidators: true });
  }
  if (!doc) {
    throw new Error('Doctor not found');
  }
  return doc;
};

export const deleteDoctor = async (id) => {
  let doc = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    doc = await Doctor.findByIdAndDelete(id);
  }
  if (!doc) {
    doc = await Doctor.findOneAndDelete({ $or: [{ docId: id }, { email: (id || '').toLowerCase() }] });
  }
  if (!doc) {
    throw new Error('Doctor not found');
  }
  return doc;
};
