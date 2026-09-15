import { Staff } from './staff.model.js';
import { User } from '../auth/auth.model.js';
import { hashPassword } from '../auth/auth.utils.js';

export const generateNextEmpId = async (branch) => {
  const query = branch && branch !== 'All' ? { branch: new RegExp(`^${branch.trim()}$`, 'i') } : {};
  const count = await Staff.countDocuments(query);
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

export const createStaff = async (staffData) => {
  const branchToUse = staffData.branch || '';
  const branchCodeToUse = staffData.branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');
  const emailToUse = (staffData.email || `${staffData.name.toLowerCase().replace(/\s+/g, '.')}@krishnahospital.org`).trim().toLowerCase();
  const passwordToUse = staffData.password || 'Staff@123';

  let empIdToUse = staffData.empId || staffData.id;

  if (!empIdToUse || empIdToUse.length < 5 || empIdToUse.includes('usr-')) {
    empIdToUse = await generateNextEmpId(branchToUse);
  }

  const newStaff = await Staff.create({
    empId: empIdToUse,
    name: staffData.name.trim(),
    role: staffData.role.trim(),
    department: staffData.department || 'General Operations',
    phone: staffData.phone.trim(),
    email: emailToUse,
    salary: staffData.salary || '₹ 30,000',
    shift: staffData.shift || 'Day Shift (08:00 AM - 04:00 PM)',
    qualification: staffData.qualification || 'Graduate',
    experience: staffData.experience || '3 Years',
    status: staffData.status || 'Active',
    leaveReason: staffData.leaveReason || '',
    dateJoined: staffData.dateJoined || new Date().toISOString().split('T')[0],
    password: passwordToUse,
    branch: branchToUse,
    branchCode: branchCodeToUse,
  });

  // Role Mapping for User Login Account Creation
  let mappedRole = 'Front Desk';
  if (staffData.role.includes('Doctor')) mappedRole = 'Doctor';
  else if (staffData.role.includes('Lab')) mappedRole = 'Lab Assistant';
  else if (staffData.role.includes('Pharm')) mappedRole = 'Pharmacist';
  else if (staffData.role.includes('Admin')) mappedRole = 'Admin';
  else if (staffData.role.includes('Front Desk')) mappedRole = 'Front Desk';

  // Auto-provision User Login Account
  const existingUser = await User.findOne({ email: emailToUse });
  if (!existingUser) {
    const hashedPassword = await hashPassword(passwordToUse);
    await User.create({
      email: emailToUse,
      password: hashedPassword,
      full_name: staffData.name.trim(),
      role: mappedRole,
      department: staffData.department || 'Operations',
      phone: staffData.phone.trim(),
      branch: branchToUse,
      branchCode: branchCodeToUse,
    });
  }

  return newStaff;
};

export const getAllStaff = async (branchFilter = null) => {
  const query = {};
  if (branchFilter && branchFilter !== 'All') {
    const escaped = branchFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { branch: { $regex: new RegExp(escaped, 'i') } },
      { branchCode: { $regex: new RegExp(escaped, 'i') } },
    ];
  }
  return await Staff.find(query).sort({ createdAt: -1 });
};

export const getStaffById = async (id) => {
  let member = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    member = await Staff.findById(id);
  }
  if (!member) {
    member = await Staff.findOne({ $or: [{ empId: id }, { email: (id || '').toLowerCase() }] });
  }
  if (!member) {
    throw new Error('Staff member not found');
  }
  return member;
};

export const updateStaff = async (id, updateData) => {
  let member = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    member = await Staff.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }
  if (!member) {
    member = await Staff.findOneAndUpdate({ $or: [{ empId: id }, { email: (id || '').toLowerCase() }] }, updateData, { new: true, runValidators: true });
  }
  if (!member) {
    throw new Error('Staff member not found');
  }
  return member;
};

export const deleteStaff = async (id) => {
  let member = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    member = await Staff.findByIdAndDelete(id);
  }
  if (!member) {
    member = await Staff.findOneAndDelete({ $or: [{ empId: id }, { email: (id || '').toLowerCase() }] });
  }
  if (!member) {
    throw new Error('Staff member not found');
  }
  return member;
};
