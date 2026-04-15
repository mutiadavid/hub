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

    if (result?.error?.status === 401 && hasActiveToken) {
      const statusCode = result.error?.data?.code;
      const fallbackMessage = result.error?.data?.message;
      persistAuthStatusMessage(resolveAuthStatusMessage(statusCode, fallbackMessage));
      api.dispatch(logout());
    }

    return result;
  };
};