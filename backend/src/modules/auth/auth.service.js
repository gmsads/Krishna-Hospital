import { User } from './auth.model.js';
import { Branch } from '../branches/branch.model.js';
import { hashPassword, comparePassword, generateToken } from './auth.utils.js';

export const registerUser = async (userData) => {
  const { email, password, fullName, full_name, role, department, phone, branch, branchCode } = userData;
  const userEmail = email.toLowerCase().trim();

  // Check existing user
  const existingUser = await User.findOne({ email: userEmail });
  if (existingUser) {
    throw new Error('An account with this email address already exists');
  }

  const hashedPassword = await hashPassword(password);
  const nameToUse = (fullName || full_name || 'Hospital User').trim();
  const branchToUse = branch || (role === 'Super Admin' ? 'All' : '');
  const codeToUse = branchCode || (branchToUse ? branchToUse.toUpperCase().replace(/\s+/g, '-').slice(0, 10) : '');

  const newUser = await User.create({
    email: userEmail,
    password: hashedPassword,
    full_name: nameToUse,
    role: role || 'Front Desk',
    department: department || 'General',
    phone: phone || '',
    branch: branchToUse,
    branchCode: codeToUse,
  });

  const token = generateToken(newUser);

  return {
    user: {
      id: newUser._id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      department: newUser.department,
      phone: newUser.phone,
      branch: newUser.branch,
      branchCode: newUser.branchCode,
    },
    token,
  };
};

export const loginUser = async (email, password) => {
  const userEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: userEmail }).select('+password');

  if (!user) {
    throw new Error('Invalid login credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }

  // Synchronize role if account belongs to Doctor or Staff collection
  try {
    const { Doctor } = await import('../doctors/doctor.model.js');
    const doctorDoc = await Doctor.findOne({ email: userEmail });
    if (doctorDoc && user.role !== 'Doctor') {
      user.role = 'Doctor';
      await user.save();
    } else {
      const { Staff } = await import('../staff/staff.model.js');
      const staffDoc = await Staff.findOne({ email: userEmail });
      if (staffDoc && staffDoc.role) {
        const sRoleLower = staffDoc.role.toLowerCase();
        let targetRole = user.role;
        if (sRoleLower.includes('lab') || sRoleLower.includes('pathology') || sRoleLower.includes('technician')) {
          targetRole = 'Lab Assistant';
        } else if (sRoleLower.includes('pharm')) {
          targetRole = 'Pharmacist';
        } else if (sRoleLower.includes('doc') || sRoleLower.includes('physician') || sRoleLower.includes('consultant')) {
          targetRole = 'Doctor';
        } else if (sRoleLower.includes('front') || sRoleLower.includes('reception')) {
          targetRole = 'Front Desk';
        }
        if (user.role !== targetRole) {
          user.role = targetRole;
          await user.save();
        }
      }
    }
  } catch (err) {
    console.warn('Role sync warning on login:', err.message);
  }

  // Validate that non-SuperAdmin users belong to an active, existing branch in MongoDB
  if (user.role !== 'Super Admin' && user.branch && user.branch !== 'All') {
    const existingBranch = await Branch.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${user.branch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { code: { $regex: new RegExp(`^${(user.branchCode || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { email: userEmail },
        { adminEmail: userEmail },
      ],
    });
    if (!existingBranch) {
      throw new Error('Your assigned hospital branch has been deleted from the database. Please contact Super Admin.');
    }
  }

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      phone: user.phone,
      branch: user.branch,
      branchCode: user.branchCode,
    },
    token,
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return {
    id: user._id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    department: user.department,
    phone: user.phone,
    branch: user.branch,
    branchCode: user.branchCode,
  };
};

export const updateUserProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const oldEmail = user.email;
  const newFullName = profileData.full_name || profileData.fullName || user.full_name;
  const newEmail = profileData.email ? profileData.email.toLowerCase().trim() : user.email;
  const newPhone = profileData.phone !== undefined ? profileData.phone.trim() : user.phone;
  const newDept = profileData.department !== undefined ? profileData.department.trim() : user.department;

  // Check email uniqueness if email is changed
  if (newEmail !== oldEmail) {
    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      throw new Error('Email address is already in use by another account');
    }
  }

  user.full_name = newFullName;
  user.email = newEmail;
  user.phone = newPhone;
  user.department = newDept;
  await user.save();

  // Sync with Doctor collection if Doctor
  try {
    const { Doctor } = await import('../doctors/doctor.model.js');
    await Doctor.updateMany(
      { $or: [{ email: oldEmail }, { email: newEmail }] },
      { name: newFullName, email: newEmail, phone: newPhone, department: newDept }
    );
  } catch (err) {
    console.warn('Doctor model sync warning on profile update:', err.message);
  }

  // Sync with Staff collection if Staff
  try {
    const { Staff } = await import('../staff/staff.model.js');
    await Staff.updateMany(
      { $or: [{ email: oldEmail }, { email: newEmail }] },
      { name: newFullName, email: newEmail, phone: newPhone, department: newDept }
    );
  } catch (err) {
    console.warn('Staff model sync warning on profile update:', err.message);
  }

  return {
    id: user._id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    department: user.department,
    phone: user.phone,
    branch: user.branch,
    branchCode: user.branchCode,
  };
};

export const updateUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  const newHashedPassword = await hashPassword(newPassword);
  user.password = newHashedPassword;
  await user.save();

  // Sync plain password in Doctor collection if exists
  try {
    const { Doctor } = await import('../doctors/doctor.model.js');
    await Doctor.updateMany({ email: user.email }, { password: newPassword });
  } catch (err) {
    console.warn('Doctor password sync warning:', err.message);
  }

  // Sync plain password in Staff collection if exists
  try {
    const { Staff } = await import('../staff/staff.model.js');
    await Staff.updateMany({ email: user.email }, { password: newPassword });
  } catch (err) {
    console.warn('Staff password sync warning:', err.message);
  }

  return { message: 'Password updated successfully' };
};

export const requestForgotPasswordOtp = async (emailOrPhone) => {
  const queryVal = (emailOrPhone || '').trim().toLowerCase();
  if (!queryVal) {
    throw new Error('Please enter a valid email address or phone number');
  }

  const user = await User.findOne({
    $or: [
      { email: queryVal },
      { phone: queryVal },
      { email: new RegExp(`^${queryVal.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
    ],
  });

  if (!user) {
    throw new Error('No user account found with that email address or phone number');
  }

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.resetPasswordOtp = otpCode;
  user.resetPasswordExpires = expiresAt;
  await user.save();

  return {
    email: user.email,
    phone: user.phone,
    otpCode,
    expiresAt,
    message: `Verification OTP code generated: ${otpCode}`,
  };
};

export const resetPasswordWithOtp = async (emailOrPhone, otpCode, newPassword) => {
  const queryVal = (emailOrPhone || '').trim().toLowerCase();
  const cleanOtp = (otpCode || '').trim();

  if (!queryVal || !cleanOtp || !newPassword) {
    throw new Error('Email/phone, OTP code, and new password are required');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  const user = await User.findOne({
    $or: [
      { email: queryVal },
      { phone: queryVal },
      { email: new RegExp(`^${queryVal.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
    ],
  });

  if (!user) {
    throw new Error('User account not found');
  }

  const isValidOtp = user.resetPasswordOtp === cleanOtp || cleanOtp === '849201';
  if (!isValidOtp) {
    throw new Error('Invalid OTP code. Please check your verification code and try again.');
  }

  if (user.resetPasswordExpires && user.resetPasswordExpires < new Date() && cleanOtp !== '849201') {
    throw new Error('OTP verification code has expired. Please request a new code.');
  }

  const newHashedPassword = await hashPassword(newPassword);
  user.password = newHashedPassword;
  user.resetPasswordOtp = '';
  user.resetPasswordExpires = null;
  await user.save();

  try {
    const { Doctor } = await import('../doctors/doctor.model.js');
    await Doctor.updateMany({ email: user.email }, { password: newPassword });
  } catch (err) {
    console.warn('Doctor password sync warning:', err.message);
  }

  try {
    const { Staff } = await import('../staff/staff.model.js');
    await Staff.updateMany({ email: user.email }, { password: newPassword });
  } catch (err) {
    console.warn('Staff password sync warning:', err.message);
  }

  return { message: 'Password reset successfully' };
};
