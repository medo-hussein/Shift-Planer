export const validateRegister = (form) => {
  const errors = {};

  if (!form.companyName.trim()) errors.companyName = "Company name is required";
  if (!form.name.trim()) errors.name = "Full name is required";

  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
    errors.email = "Invalid email format";
  }

  if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};

export const validateForgetPassword = (email) => {
  const errors = {};

  if (!email.trim()) errors.email = "Email is required";
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    errors.email = "Invalid email format";
  }

  return errors;
};

export const validateResetPassword = (form) => {
  const errors = {};

  if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};
