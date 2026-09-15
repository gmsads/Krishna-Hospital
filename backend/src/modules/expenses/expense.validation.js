export const validateExpenseInput = (data) => {
  const errors = {};

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.title = 'Expense title is required';
  }

  const amt = parseFloat(String(data.amount || '0').replace(/[^0-9.]/g, ''));
  if (data.amount === undefined || data.amount === null || isNaN(amt) || amt <= 0) {
    errors.amount = 'Valid expense amount greater than 0 is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
