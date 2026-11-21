import { Branch } from './branch.model.js';
import { User } from '../auth/auth.model.js';
import { hashPassword } from '../auth/auth.utils.js';

export const createBranch = async (branchData) => {
  const { name, code, location, phone, email, adminEmail, adminName, adminPassword, status } = branchData;

  const branchCodeUpper = code.trim().toUpperCase();
  const branchNameTrimmed = name.trim();

  // Check existing branch
  const existingBranch = await Branch.findOne({
    $or: [{ name: branchNameTrimmed }, { code: branchCodeUpper }],
  });

  if (existingBranch) {
    throw new Error(`Branch with name '${branchNameTrimmed}' or code '${branchCodeUpper}' already exists`);
  }

  const emailToUse = (adminEmail || email || `${branchNameTrimmed.toLowerCase().replace(/\s+/g, '.')}@krishnahospital.org`).trim().toLowerCase();
  const passwordToUse = adminPassword || 'admin123';
  const adminNameToUse = (adminName || `${branchNameTrimmed} Admin`).trim();

  const newBranch = await Branch.create({
    name: branchNameTrimmed,
    code: branchCodeUpper,
    location: location.trim(),
    phone: phone ? phone.trim() : '+91 98000 00000',
    email: emailToUse,
    adminName: adminNameToUse,
    adminEmail: emailToUse,
    status: status || 'Active',
  });

  // Create or update Branch Admin User Account in Users Collection
  const existingAdminUser = await User.findOne({ email: emailToUse });
  if (!existingAdminUser) {
    const hashedPassword = await hashPassword(passwordToUse);
    await User.create({
      email: emailToUse,
      password: hashedPassword,
      full_name: adminNameToUse,
      role: 'Admin',
      department: 'Management',
      phone: phone || '',
      branch: branchNameTrimmed,
      branchCode: branchCodeUpper,
    });
  }

  return newBranch;
};

export const getAllBranches = async () => {
  return await Branch.find({}).sort({ createdAt: -1 });
};

export const getBranchById = async (id) => {
  const branch = await Branch.findById(id);
  if (!branch) {
    throw new Error('Branch not found');
  }
  return branch;
};

export const updateBranch = async (id, updateData) => {
  const branch = await Branch.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!branch) {
    throw new Error('Branch not found');
  }
  return branch;
};

export const deleteBranch = async (id) => {
  const branch = await Branch.findByIdAndDelete(id);
  if (!branch) {
    throw new Error('Branch not found');
  }

  // Delete all admin & staff user login accounts associated with this deleted branch
  await User.deleteMany({
    $or: [
      { branch: branch.name },
      { branchCode: branch.code },
      { email: branch.email },
      { email: branch.adminEmail },
    ],
  });

  return branch;
};
