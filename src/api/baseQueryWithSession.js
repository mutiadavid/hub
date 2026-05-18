import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./authSlice";

export const AUTH_STATUS_MESSAGE_KEY = "authStatusMessage";

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("token");
};

const persistAuthStatusMessage = (message) => {
  if (typeof window === "undefined" || !message) {
    return;
  }

  window.sessionStorage.setItem(AUTH_STATUS_MESSAGE_KEY, message);
};

const resolveAuthStatusMessage = (statusCode, fallbackMessage) => {
  switch (statusCode) {
    case "SESSION_EXPIRED":
      return "You were logged out after 15 minutes of inactivity.";
    case "SESSION_REPLACED":
      return "Your account was signed in on another device or browser.";
    case "USER_INACTIVE":
      return "Your account is inactive. Contact an administrator.";
    case "SESSION_INVALID":
      return "Your session is no longer valid. Please sign in again.";
    default:
      return fallbackMessage || "Your session ended. Please sign in again.";
  }
};

export const consumeAuthStatusMessage = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const message = window.sessionStorage.getItem(AUTH_STATUS_MESSAGE_KEY) || "";
  if (message) {
    window.sessionStorage.removeItem(AUTH_STATUS_MESSAGE_KEY);
  }

  return message;
};

const normalizeHttpStatus = (value) => {
  const numericValue = Number(value);
  if (Number.isInteger(numericValue) && numericValue >= 400 && numericValue <= 599) {
    return numericValue;
  }

  return 500;
};

export const sanitizeApiError = (error) => {
  if (!error) {
    return error;
  }

  const status = normalizeHttpStatus(error.status ?? error.data?.status);
  return {
    ...error,
    status,
    originalStatus: null,
    error: null,
    data: {
      status,
      message: error.data?.message || error.data?.error || error.message || "",
      code: error.data?.code || ""
    },
  };
};

export const createBaseQueryWithSession = ({ baseUrl }) => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token || getStoredToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    const hasActiveToken = Boolean(api.getState()?.auth?.token || getStoredToken());

    // Don't logout on 401 for heartbeat requests - just silently fail
    if (result?.error?.status === 401 && hasActiveToken) {
      const isHeartbeatRequest = args?.url?.includes('presence/heartbeat');
      if (!isHeartbeatRequest) {
        const statusCode = result.error?.data?.code;
        persistAuthStatusMessage(resolveAuthStatusMessage(statusCode));
        api.dispatch(logout());
      }
    }

    if (result?.error) {
      result.error = sanitizeApiError(result.error);
    }

    return result;
  };
};