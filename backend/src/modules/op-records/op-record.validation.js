export const validateOPRecordInput = (data) => {
  const errors = {};

  if (!data.patientName || !data.patientName.trim()) {
    errors.patientName = 'Patient name is required';
  }
  if (!data.phone || !data.phone.trim()) {
    errors.phone = 'Patient phone number is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
