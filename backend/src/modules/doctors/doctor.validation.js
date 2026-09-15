export const validateDoctorInput = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Doctor full name is required';
  }
  if (!data.phone || !data.phone.trim()) {
    errors.phone = 'Phone number is required';
  }
  if (!data.department || !data.department.trim()) {
    errors.department = 'Department is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
