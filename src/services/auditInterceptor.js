/**
 * Axios Interceptor for Automatic Audit Logging
 * Logs all API requests and responses for compliance tracking
 *
 * Usage: Import and call setupAuditInterceptors() in your app initialization
 */

import axios from "axios";
import { createAuditLog } from "./auditLogService";

let axiosInstance;

/**
 * Setup audit logging interceptors on an axios instance
 * @param {AxiosInstance} instance - The axios instance to intercept
 */
export const setupAuditInterceptors = (instance) => {
  axiosInstance = instance;

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Store request metadata for later use in response interceptor
      config.metadata = {
        startTime: Date.now(),
        method: config.method.toUpperCase(),
        url: config.url,
      };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      const { config } = response;
      const duration = Date.now() - config.metadata.startTime;

      // Map API endpoints to audit log actions
      logAPICall({
        method: config.metadata.method,
        url: config.metadata.url,
        status: response.status,
        statusText: response.statusText,
        duration,
        isSuccess: true,
        data: response.data,
      });

      return response;
    },
    (error) => {
      const { config } = error;
      const duration = config?.metadata
        ? Date.now() - config.metadata.startTime
        : 0;

      logAPICall({
        method: config?.metadata?.method || "UNKNOWN",
        url: config?.metadata?.url || "UNKNOWN",
        status: error.response?.status || 0,
        statusText: error.response?.statusText || error.message,
        duration,
        isSuccess: false,
        errorMessage: error.message,
      });

      return Promise.reject(error);
    }
  );
};

/**
 * Log API call to audit system
 * @param {Object} callData - API call details
 */
const logAPICall = async (callData) => {
  try {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    // Parse URL to determine action and resource
    const { action, resource, resourceId } = parseURL(
      callData.url,
      callData.method
    );

    // Only log mutating operations (POST, PUT, DELETE, PATCH)
    const isMutating = ["POST", "PUT", "DELETE", "PATCH"].includes(
      callData.method
    );

    if (isMutating && userId) {
      await createAuditLog({
        action,
        performedById: userId,
        performedByName: userName,
        resource,
        resourceId,
        details: `API ${callData.method} request to ${callData.url} (${callData.duration}ms)`,
        status: callData.isSuccess ? "success" : "failure",
        errorMessage: callData.errorMessage,
      });
    }
  } catch (err) {
    console.error("❌ Error logging API call:", err.message);
    // Don't throw - we don't want logging to break the app
  }
};

/**
 * Parse API URL to extract action and resource
 * @param {string} url - Full API URL
 * @param {string} method - HTTP method
 * @returns {Object} { action, resource, resourceId }
 */
const parseURL = (url, method) => {
  const urlMap = {
    // User endpoints
    "/api/users": {
      POST: { action: "CREATE_USER", resource: "USER" },
      GET: { action: "GET_USERS", resource: "USER" },
      PUT: { action: "UPDATE_USER", resource: "USER" },
      DELETE: { action: "DELETE_USER", resource: "USER" },
    },
    "/api/auth/login": {
      POST: { action: "LOGIN", resource: "AUTH" },
    },
    "/api/auth/logout": {
      POST: { action: "LOGOUT", resource: "AUTH" },
    },
    // Deferral endpoints
    "/api/deferrals": {
      POST: { action: "CREATE_DEFERRAL", resource: "DEFERRAL" },
      GET: { action: "GET_DEFERRALS", resource: "DEFERRAL" },
      PUT: { action: "UPDATE_DEFERRAL", resource: "DEFERRAL" },
      DELETE: { action: "DELETE_DEFERRAL", resource: "DEFERRAL" },
    },
    "/api/deferrals/approve": {
      POST: { action: "APPROVE_DEFERRAL", resource: "DEFERRAL" },
    },
    "/api/deferrals/reject": {
      POST: { action: "REJECT_DEFERRAL", resource: "DEFERRAL" },
    },
    // Checklist endpoints
    "/api/checklists": {
      POST: { action: "CREATE_CHECKLIST", resource: "CHECKLIST" },
      GET: { action: "GET_CHECKLISTS", resource: "CHECKLIST" },
      PUT: { action: "UPDATE_CHECKLIST", resource: "CHECKLIST" },
      DELETE: { action: "DELETE_CHECKLIST", resource: "CHECKLIST" },
    },
    // File upload
    "/api/upload": {
      POST: { action: "UPLOAD_FILE", resource: "FILE" },
    },
    // Audit logs
    "/api/audit-logs": {
      POST: { action: "CREATE_AUDIT_LOG", resource: "AUDIT" },
      GET: { action: "VIEW_AUDIT_LOGS", resource: "AUDIT" },
    },
  };

  // Try to match the URL pattern
  for (const [pattern, methods] of Object.entries(urlMap)) {
    if (url.includes(pattern)) {
      const action = methods[method] || methods.GET;
      if (action) {
        // Extract resource ID if present
        const match = url.match(/(\w+)\/([a-f0-9]{24}|[0-9]+)$/);
        const resourceId = match?.[2];
        return {
          action: action.action,
          resource: action.resource,
          resourceId,
        };
      }
    }
  }

  // Default fallback
  return {
    action: `${method}_OPERATION`,
    resource: "SYSTEM",
    resourceId: null,
  };
};

export default setupAuditInterceptors;
