export const getAuthErrorMessage = (err) => {
  if (!err) {
    return "Login failed";
  }

  const validationErrors = err.data?.errors;
  if (validationErrors && typeof validationErrors === "object") {
    const firstValidationMessage = Object.values(validationErrors)
      .flat()
      .find((message) => typeof message === "string" && message.trim());

    if (firstValidationMessage) {
      return firstValidationMessage;
    }
  }

  if (typeof err.data === "string" && err.data.trim()) {
    return err.data;
  }

  if (err.data?.message) {
    return err.data.message;
  }

  if (err.error) {
    return err.error;
  }

  return "Login failed";
};

export const toLoggableAuthError = (err) => ({
  status: err?.status ?? null,
  data: err?.data ?? null,
  error: err?.error ?? null,
  originalStatus: err?.originalStatus ?? null,
});