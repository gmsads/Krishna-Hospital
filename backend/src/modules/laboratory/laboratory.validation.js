export const validateLabOrderInput = (data) => {
  const errors = {};

  const patient = data.patientName || data.patient;
  const test = data.testName || data.test;

  if (!patient || !patient.trim()) {
    errors.patientName = 'Patient name is required';
  }
  if (!test || !test.trim()) {
    errors.testName = 'Test name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
