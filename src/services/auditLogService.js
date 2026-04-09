/**
 * Audit Log Service
 * Centralized logging for all user operations in the banking system
 * Logs: User login/logout, user management, role changes, deferral actions, file uploads, etc.
 */

import axios from "axios";
import { API_ORIGIN } from "../config/runtimeConfig";

const API_URL = API_ORIGIN;
const AUDIT_ENDPOINT = `${API_URL}/api/audit-logs`;

/**
 * Create an audit log entry
 * @param {Object} logData - Audit log data
 * @param {string} logData.action - Action performed (e.g., 'LOGIN', 'CREATE_USER', 'UPDATE_ROLE')
 * @param {string} logData.performedBy - User ID who performed the action
 * @param {string} logData.performedByName - User name who performed the action
 * @param {string} logData.targetUser - Target user ID (if applicable)
 * @param {string} logData.targetUserName - Target user name (if applicable)
 * @param {string} logData.targetRole - Target role (if applicable)
 * @param {string} logData.resource - Resource affected (e.g., 'USER', 'DEFERRAL', 'CHECKLIST')
 * @param {string} logData.resourceId - Resource ID
 * @param {string} logData.details - Additional details
 * @param {string} logData.status - Result status ('success' or 'failure')
 * @param {string} logData.errorMessage - Error message if failed
 * @returns {Promise<Object>}
 */
export const createAuditLog = async (logData) => {
  try {
    const token = localStorage.getItem("token");

    const payload = {
      action: logData.action,
      performedBy: {
        _id: logData.performedById || localStorage.getItem("userId"),
        name: logData.performedByName || localStorage.getItem("userName"),
        email: localStorage.getItem("userEmail"),
      },
      targetUser: logData.targetUser
        ? {
            _id: logData.targetUserId,
            name: logData.targetUserName,
            email: logData.targetUserEmail,
          }
        : null,
      targetRole: logData.targetRole,
      resource: logData.resource || "SYSTEM",
      resourceId: logData.resourceId,
      details: logData.details,
      status: logData.status || "success",
      errorMessage: logData.errorMessage,
      timestamp: new Date(),
    };

    const response = await axios.post(AUDIT_ENDPOINT, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Audit log created:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to create audit log:", error.message);
    // Don't throw - we don't want logging failures to break the app
  }
};

/**
 * Log user login
 */
export const logUserLogin = async (userId, userName, email) => {
  await createAuditLog({
    action: "LOGIN",
    performedById: userId,
    performedByName: userName,
    resource: "USER",
    resourceId: userId,
    details: `User ${userName} logged in from ${window.location.hostname}`,
    status: "success",
  });
};

/**
 * Log user logout
 */
export const logUserLogout = async (userId, userName) => {
  await createAuditLog({
    action: "LOGOUT",
    performedById: userId,
    performedByName: userName,
    resource: "USER",
    resourceId: userId,
    details: `User ${userName} logged out`,
    status: "success",
  });
};

/**
 * Log user creation
 */
export const logUserCreated = async (
  adminId,
  adminName,
  newUserId,
  newUserName,
  newUserEmail,
  role
) => {
  await createAuditLog({
    action: "CREATE_USER",
    performedById: adminId,
    performedByName: adminName,
    targetUserId: newUserId,
    targetUserName: newUserName,
    targetUserEmail: newUserEmail,
    targetRole: role,
    resource: "USER",
    resourceId: newUserId,
    details: `Created new user ${newUserName} with role ${role}`,
    status: "success",
  });
};

/**
 * Log user update
 */
export const logUserUpdated = async (
  adminId,
  adminName,
  targetUserId,
  targetUserName,
  changes
) => {
  await createAuditLog({
    action: "UPDATE_USER",
    performedById: adminId,
    performedByName: adminName,
    targetUserId: targetUserId,
    targetUserName: targetUserName,
    resource: "USER",
    resourceId: targetUserId,
    details: `Updated user: ${JSON.stringify(changes)}`,
    status: "success",
  });
};

/**
 * Log role change
 */
export const logRoleChanged = async (
  adminId,
  adminName,
  targetUserId,
  targetUserName,
  oldRole,
  newRole
) => {
  await createAuditLog({
    action: "CHANGE_ROLE",
    performedById: adminId,
    performedByName: adminName,
    targetUserId: targetUserId,
    targetUserName: targetUserName,
    targetRole: newRole,
    resource: "USER",
    resourceId: targetUserId,
    details: `Changed role from ${oldRole} to ${newRole}`,
    status: "success",
  });
};

/**
 * Log user activation/deactivation
 */
export const logUserStatusChanged = async (
  adminId,
  adminName,
  targetUserId,
  targetUserName,
  isActive
) => {
  await createAuditLog({
    action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    performedById: adminId,
    performedByName: adminName,
    targetUserId: targetUserId,
    targetUserName: targetUserName,
    resource: "USER",
    resourceId: targetUserId,
    details: `User ${isActive ? "activated" : "deactivated"}`,
    status: "success",
  });
};

/**
 * Log deferral creation
 */
export const logDeferralCreated = async (
  userId,
  userName,
  deferralId,
  customerName,
  deferralNumber
) => {
  await createAuditLog({
    action: "CREATE_DEFERRAL",
    performedById: userId,
    performedByName: userName,
    resource: "DEFERRAL",
    resourceId: deferralId,
    details: `Created deferral ${deferralNumber} for customer ${customerName}`,
    status: "success",
  });
};

/**
 * Log deferral approval
 */
export const logDeferralApproved = async (
  userId,
  userName,
  deferralId,
  deferralNumber,
  approverRole
) => {
  await createAuditLog({
    action: "APPROVE_DEFERRAL",
    performedById: userId,
    performedByName: userName,
    resource: "DEFERRAL",
    resourceId: deferralId,
    details: `Approved deferral ${deferralNumber} as ${approverRole}`,
    status: "success",
  });
};

/**
 * Log deferral rejection
 */
export const logDeferralRejected = async (
  userId,
  userName,
  deferralId,
  deferralNumber,
  reason
) => {
  await createAuditLog({
    action: "REJECT_DEFERRAL",
    performedById: userId,
    performedByName: userName,
    resource: "DEFERRAL",
    resourceId: deferralId,
    details: `Rejected deferral ${deferralNumber}. Reason: ${reason}`,
    status: "success",
  });
};

/**
 * Log checklist creation
 */
export const logChecklistCreated = async (
  userId,
  userName,
  checklistId,
  customerName
) => {
  await createAuditLog({
    action: "CREATE_CHECKLIST",
    performedById: userId,
    performedByName: userName,
    resource: "CHECKLIST",
    resourceId: checklistId,
    details: `Created checklist for customer ${customerName}`,
    status: "success",
  });
};

/**
 * Log file upload
 */
export const logFileUploaded = async (
  userId,
  userName,
  fileName,
  resourceType,
  resourceId
) => {
  await createAuditLog({
    action: "UPLOAD_FILE",
    performedById: userId,
    performedByName: userName,
    resource: resourceType,
    resourceId: resourceId,
    details: `Uploaded file: ${fileName}`,
    status: "success",
  });
};

/**
 * Log API error/failure
 */
export const logOperationFailed = async (
  userId,
  userName,
  action,
  resource,
  resourceId,
  errorMessage
) => {
  await createAuditLog({
    action: action,
    performedById: userId,
    performedByName: userName,
    resource: resource,
    resourceId: resourceId,
    details: `Operation failed`,
    status: "failure",
    errorMessage: errorMessage,
  });
};

export default {
  createAuditLog,
  logUserLogin,
  logUserLogout,
  logUserCreated,
  logUserUpdated,
  logRoleChanged,
  logUserStatusChanged,
  logDeferralCreated,
  logDeferralApproved,
  logDeferralRejected,
  logChecklistCreated,
  logFileUploaded,
  logOperationFailed,
};
