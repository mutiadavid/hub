/**
 * AUDIT LOGGING IMPLEMENTATION GUIDE
 *
 * This guide shows how to integrate audit logging throughout the banking system
 * to monitor every user operation for compliance and security.
 */

// ============================================================================
// 1. SETUP: Initialize Audit Logging in your main App.jsx
// ============================================================================

import setupAuditInterceptors from "../services/auditInterceptor";
import { logUserLogin, logUserLogout } from "../services/auditLogService";
import axiosInstance from "../api/axiosConfig"; // Your axios instance

// In your App.jsx useEffect:
// setupAuditInterceptors(axiosInstance);

// ============================================================================
// 2. LOGIN PAGE: Log user login attempts
// ============================================================================

// In your LoginPage.jsx:

import { logUserLogin } from "../services/auditLogService";

const handleLogin = async (email, password) => {
  try {
    const response = await loginAPI(email, password);
    const { user, token } = response.data;

    // Store user info
    localStorage.setItem("userId", user._id);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("token", token);

    // Log the login event
    await logUserLogin(user._id, user.name, user.email);

    message.success("Login successful!");
    navigate("/dashboard");
  } catch (error) {
    // Log failed login attempt
    await createAuditLog({
      action: "LOGIN_FAILED",
      performedByName: email,
      resource: "AUTH",
      details: `Failed login attempt for ${email}`,
      status: "failure",
      errorMessage: error.message,
    });
    message.error("Login failed!");
  }
};

// ============================================================================
// 3. LOGOUT: Log user logout
// ============================================================================

// In your logout handler:

import { logUserLogout } from "../services/auditLogService";

const handleLogout = async () => {
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  // Log logout
  await logUserLogout(userId, userName);

  // Clear auth
  localStorage.clear();
  navigate("/login");
};

// ============================================================================
// 4. USER MANAGEMENT: Log user creation, updates, role changes
// ============================================================================

// In your CreateUserModal.jsx or Admin Dashboard:

import {
  logUserCreated,
  logRoleChanged,
  logUserStatusChanged,
} from "../services/auditLogService";

const handleCreateUser = async (formData) => {
  try {
    const response = await createUserAPI(formData);
    const newUser = response.data;

    // Log user creation
    await logUserCreated(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      newUser._id,
      newUser.name,
      newUser.email,
      newUser.role
    );

    message.success(`User ${newUser.name} created successfully!`);
  } catch (error) {
    message.error("Failed to create user");
  }
};

const handleChangeRole = async (userId, userName, oldRole, newRole) => {
  try {
    await changeRoleAPI(userId, newRole);

    // Log role change
    await logRoleChanged(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      userId,
      userName,
      oldRole,
      newRole
    );

    message.success(`Role changed from ${oldRole} to ${newRole}`);
  } catch (error) {
    message.error("Failed to change role");
  }
};

const handleToggleActive = async (userId, userName, isActive) => {
  try {
    await toggleActiveAPI(userId);

    // Log status change
    await logUserStatusChanged(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      userId,
      userName,
      !isActive // New status
    );

    message.success(`User ${isActive ? "activated" : "deactivated"}`);
  } catch (error) {
    message.error("Failed to change user status");
  }
};

// ============================================================================
// 5. DEFERRAL OPERATIONS: Log deferral creation, approvals, rejections
// ============================================================================

// In your DeferralForm.jsx:

import {
  logDeferralCreated,
  logDeferralApproved,
  logDeferralRejected,
} from "../services/auditLogService";

const handleCreateDeferral = async (formData) => {
  try {
    const response = await createDeferralAPI(formData);
    const deferral = response.data;

    // Log deferral creation
    await logDeferralCreated(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      deferral._id,
      formData.customerName,
      deferral.deferralNumber
    );

    message.success("Deferral request created!");
  } catch (error) {
    message.error("Failed to create deferral");
  }
};

// In your approval workflow:

const handleApproveDeferral = async (deferralId, deferralNumber) => {
  try {
    await approveDeferralAPI(deferralId);

    // Log approval
    await logDeferralApproved(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      deferralId,
      deferralNumber,
      localStorage.getItem("userRole")
    );

    message.success("Deferral approved!");
  } catch (error) {
    message.error("Failed to approve deferral");
  }
};

const handleRejectDeferral = async (deferralId, deferralNumber, reason) => {
  try {
    await rejectDeferralAPI(deferralId, reason);

    // Log rejection
    await logDeferralRejected(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      deferralId,
      deferralNumber,
      reason
    );

    message.success("Deferral rejected!");
  } catch (error) {
    message.error("Failed to reject deferral");
  }
};

// ============================================================================
// 6. CHECKLIST OPERATIONS: Log checklist creation and completion
// ============================================================================

// In your ChecklistForm.jsx:

import { logChecklistCreated } from "../services/auditLogService";

const handleCreateChecklist = async (formData) => {
  try {
    const response = await createChecklistAPI(formData);
    const checklist = response.data;

    // Log checklist creation
    await logChecklistCreated(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      checklist._id,
      formData.customerName
    );

    message.success("Checklist created!");
  } catch (error) {
    message.error("Failed to create checklist");
  }
};

// ============================================================================
// 7. FILE UPLOADS: Log document uploads
// ============================================================================

// In your FileUploader.jsx:

import { logFileUploaded } from "../services/auditLogService";

const handleFileUpload = async (file, resourceType, resourceId) => {
  try {
    const response = await uploadFileAPI(file);

    // Log file upload
    await logFileUploaded(
      localStorage.getItem("userId"),
      localStorage.getItem("userName"),
      file.name,
      resourceType, // e.g., "DEFERRAL", "CHECKLIST"
      resourceId
    );

    message.success("File uploaded successfully!");
  } catch (error) {
    message.error("Failed to upload file");
  }
};

// ============================================================================
// 8. QUERYING AUDIT LOGS: Fetch and display audit trail
// ============================================================================

// In your admin dashboard:

import { useGetAuditLogsQuery } from "../api/auditApi";

const AdminAuditPage = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    action: null,
    userId: null,
  });

  const { data: logsData, isLoading } = useGetAuditLogsQuery(filters);

  // Display logs, export to CSV/PDF, etc.
  // See AuditTrailViewer.jsx for complete implementation
};

// ============================================================================
// SUMMARY OF AUDIT LOG ACTIONS TRACKED
// ============================================================================

/*
  AUTH OPERATIONS:
  - LOGIN
  - LOGIN_FAILED
  - LOGOUT
  - CHANGE_PASSWORD

  USER OPERATIONS:
  - CREATE_USER
  - UPDATE_USER
  - DELETE_USER
  - CHANGE_ROLE
  - ACTIVATE_USER
  - DEACTIVATE_USER

  DEFERRAL OPERATIONS:
  - CREATE_DEFERRAL
  - UPDATE_DEFERRAL
  - DELETE_DEFERRAL
  - APPROVE_DEFERRAL
  - REJECT_DEFERRAL
  - SUBMIT_DEFERRAL

  CHECKLIST OPERATIONS:
  - CREATE_CHECKLIST
  - UPDATE_CHECKLIST
  - DELETE_CHECKLIST
  - SUBMIT_CHECKLIST
  - COMPLETE_CHECKLIST

  FILE OPERATIONS:
  - UPLOAD_FILE
  - DELETE_FILE
  - DOWNLOAD_FILE

  SYSTEM OPERATIONS:
  - VIEW_AUDIT_LOGS
  - EXPORT_AUDIT_LOGS
  - SYSTEM_CONFIG_CHANGE
*/

export default {};
