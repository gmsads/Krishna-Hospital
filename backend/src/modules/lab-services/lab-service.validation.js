export const validateLabServiceInput = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Lab service name is required';
  }
  if (!data.rate || String(data.rate).trim() === '') {
    errors.rate = 'Service rate is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
