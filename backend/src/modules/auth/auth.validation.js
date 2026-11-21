export const validateRegisterInput = (data) => {
  const errors = {};

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email address is required';
  }
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  if (!data.fullName && !data.full_name) {
    errors.full_name = 'Full name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginInput = (data) => {
  const errors = {};

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email address is required';
  }
  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
