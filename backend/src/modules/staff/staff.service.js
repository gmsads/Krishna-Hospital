import { Staff } from './staff.model.js';
import { User } from '../auth/auth.model.js';
import { hashPassword } from '../auth/auth.utils.js';

export const generateNextEmpId = async (branch) => {
  const allStaff = await Staff.find({}, { empId: 1 }).lean();
  let maxNum = 0;
  for (const s of allStaff) {
    if (s.empId) {
      const match = s.empId.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return `EMP-${String(maxNum + 1).padStart(4, '0')}`;
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
  const { _id, __v, ...dataToUpdate } = updateData;

  // 1. Locate current staff member before update
  let currentStaff = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    currentStaff = await Staff.findById(id);
  }
  if (!currentStaff) {
    currentStaff = await Staff.findOne({
      $or: [
        { empId: id },
        { email: (id || '').toLowerCase() },
        { name: updateData.name },
      ],
    });
  }

  const oldEmail = currentStaff?.email ? currentStaff.email.trim().toLowerCase() : '';
  const oldName = currentStaff?.name ? currentStaff.name.trim() : '';

  if (dataToUpdate.email) {
    dataToUpdate.email = dataToUpdate.email.trim().toLowerCase();
  }
  if (dataToUpdate.status) {
    if (dataToUpdate.status.toLowerCase().includes('leave')) {
      dataToUpdate.status = 'On Leave';
    }
  }

  let member = null;
  if (currentStaff) {
    member = await Staff.findByIdAndUpdate(currentStaff._id, dataToUpdate, { new: true, runValidators: true });
  } else if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    member = await Staff.findByIdAndUpdate(id, dataToUpdate, { new: true, runValidators: true });
  } else {
    member = await Staff.findOneAndUpdate(
      { $or: [{ empId: id }, { email: (id || '').toLowerCase() }, { name: updateData.name }] },
      dataToUpdate,
      { new: true, runValidators: true }
    );
  }

  if (!member) {
    throw new Error('Staff member not found');
  }

  // 2. Synchronize User login account in MongoDB
  const newEmail = member.email ? member.email.trim().toLowerCase() : '';
  const newPassword = dataToUpdate.password ? dataToUpdate.password.trim() : member.password;

  let mappedRole = 'Front Desk';
  const roleStr = (member.role || '').toLowerCase();
  if (roleStr.includes('doctor')) mappedRole = 'Doctor';
  else if (roleStr.includes('lab') || roleStr.includes('pathology') || roleStr.includes('technician')) mappedRole = 'Lab Assistant';
  else if (roleStr.includes('pharm')) mappedRole = 'Pharmacist';
  else if (roleStr.includes('admin') || roleStr.includes('super')) mappedRole = 'Admin';
  else if (roleStr.includes('front desk') || roleStr.includes('reception') || roleStr.includes('officer')) mappedRole = 'Front Desk';

  // Find User account by newEmail, oldEmail, oldName, or member.name
  const searchCriteria = [];
  if (newEmail) searchCriteria.push({ email: newEmail });
  if (oldEmail && oldEmail !== newEmail) searchCriteria.push({ email: oldEmail });
  if (oldName) searchCriteria.push({ full_name: oldName });
  if (member.name && member.name !== oldName) searchCriteria.push({ full_name: member.name.trim() });

  let existingUser = null;
  if (searchCriteria.length > 0) {
    existingUser = await User.findOne({ $or: searchCriteria });
  }

  if (existingUser) {
    if (newEmail) existingUser.email = newEmail;
    if (member.name) existingUser.full_name = member.name.trim();
    if (mappedRole) existingUser.role = mappedRole;
    if (member.department) existingUser.department = member.department;
    if (member.phone) existingUser.phone = member.phone.trim();
    if (member.branch) existingUser.branch = member.branch;
    if (member.branchCode) existingUser.branchCode = member.branchCode;
    if (dataToUpdate.password && dataToUpdate.password.trim()) {
      existingUser.password = await hashPassword(dataToUpdate.password.trim());
    }
    await existingUser.save();
  } else if (newEmail) {
    // If no user account existed, create one with the new email
    const hashedPassword = await hashPassword(newPassword || 'Staff@123');
    await User.create({
      email: newEmail,
      password: hashedPassword,
      full_name: member.name.trim(),
      role: mappedRole,
      department: member.department || 'Operations',
      phone: member.phone ? member.phone.trim() : '',
      branch: member.branch || '',
      branchCode: member.branchCode || '',
    });
  }

  return member;
};

export const deleteStaff = async (id) => {
  let member = null;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    member = await Staff.findByIdAndDelete(id);
  }
  if (!member) {
    const escapedName = (id || '').trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    member = await Staff.findOneAndDelete({
      $or: [
        { empId: id },
        { email: (id || '').toLowerCase() },
        { name: new RegExp(`^${escapedName}$`, 'i') }
      ]
    });
  }
  if (!member) {
    throw new Error('Staff member not found');
  }

  if (member.email) {
    await User.deleteMany({ email: member.email.toLowerCase() });
  }
  if (member.name) {
    await User.deleteMany({ full_name: member.name.trim() });
  }
  return member;
};
