import i18next from 'i18next';

export const validateRegister = (form) => {
  const errors = {};

  if (!form.companyName.trim()) errors.companyName = i18next.t("auth.validation.companyNameRequired");
  if (!form.name.trim()) errors.name = i18next.t("auth.validation.nameRequired");

  if (!form.email.trim()) errors.email = i18next.t("auth.validation.emailRequired");
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
    errors.email = i18next.t("auth.validation.emailInvalid");
  }

  if (form.password.length < 6) {
    errors.password = i18next.t("auth.validation.passwordMinLength");
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = i18next.t("auth.validation.passwordsNoMatch");
  }

  return errors;
};

export const validateForgetPassword = (email) => {
  const errors = {};

  if (!email.trim()) errors.email = i18next.t("auth.validation.emailRequired");
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    errors.email = i18next.t("auth.validation.emailInvalid");
  }

  return errors;
};

export const validateResetPassword = (form) => {
  const errors = {};

  if (form.password.length < 6) {
    errors.password = i18next.t("auth.validation.passwordMinLength");
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = i18next.t("auth.validation.passwordsNoMatch");
  }

  return errors;
};