export const validateBranchInput = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Branch name is required';
  }
  if (!data.code || !data.code.trim()) {
    errors.code = 'Branch code is required';
  }
  if (!data.location || !data.location.trim()) {
    errors.location = 'Branch location is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
