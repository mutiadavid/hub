const resolveStatusCode = (err) => {
  const numericStatus = Number(err?.status ?? err?.data?.status);
  return Number.isInteger(numericStatus) ? numericStatus : null;
};

export const getAuthErrorMessage = (err) => {
  const status = resolveStatusCode(err);

  switch (status) {
    case 400:
      return "The request could not be processed.";
    case 401:
      return "Invalid credentials.";
    case 403:
      return "You are not allowed to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "The request could not be completed.";
    case 422:
      return "The request failed validation.";
    default:
      return status && status >= 500
        ? "A server error occurred. Please try again."
        : "Authentication failed.";
  }
};

export const toLoggableAuthError = (err) => ({
  status: resolveStatusCode(err),
});