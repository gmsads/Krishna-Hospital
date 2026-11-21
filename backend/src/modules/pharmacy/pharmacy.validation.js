export const validatePharmacyInput = (data) => {
  const errors = {};

  const amountVal = parseFloat(data.collectingAmount);
  if (data.collectingAmount === undefined || data.collectingAmount === null || data.collectingAmount === '' || isNaN(amountVal) || amountVal <= 0) {
    errors.collectingAmount = 'Collecting amount is mandatory and must be greater than zero';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
