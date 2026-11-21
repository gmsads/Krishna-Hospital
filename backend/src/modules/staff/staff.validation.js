export const validateStaffInput = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Staff full name is required';
  }
  if (!data.phone || !data.phone.trim()) {
    errors.phone = 'Phone number is required';
  }
  if (!data.role || !data.role.trim()) {
    errors.role = 'Role is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
