import { message } from "antd";
import {
  hasDuplicateApprovers,
  validateApproverSequence,
  areApproverIdsValid,
  computeDefaultRoles,
} from "./helpers";
import { GUID_REGEX } from "./constants";

/**
 * Validate customer selection
 */
export const validateCustomer = (selectedCustomerId, customerNumber) => {
  if (!selectedCustomerId && !String(customerNumber || "").trim()) {
    message.error("Please fetch and confirm a customer before submitting");
    return false;
  }
  return true;
};

/**
 * Validate DCL number is provided
 */
export const validateDclNumber = (dclNumber) => {
  if (!dclNumber || !dclNumber.trim()) {
    message.error("Please enter DCL number");
    return false;
  }
  return true;
};

/**
 * Validate documents are selected
 */
export const validateDocumentsSelected = (selectedDocuments) => {
  if (!Array.isArray(selectedDocuments) || selectedDocuments.length === 0) {
    message.error("Please select at least one document before submitting");
    return false;
  }
  return true;
};

/**
 * Validate DCL file is uploaded
 */
export const validateDclFileUploaded = (dclFile) => {
  if (!dclFile) {
    message.error("DCL document is required for submission");
    return false;
  }
  return true;
};

/**
 * Validate approvers
 */
export const validateApprovers = (
  approverSlots,
  selectedDocuments,
  loanAmount,
  approverList
) => {
  // Check for duplicate approvers
  if (hasDuplicateApprovers(approverSlots)) {
    message.error(
      "Same approver cannot be selected for multiple approval steps"
    );
    return false;
  }

  // Check all slots are filled
  const selectedSlots = approverSlots.filter((slot) => !!slot.userId);
  if (selectedSlots.length !== approverSlots.length) {
    message.error("Please assign all approvers before submitting");
    return false;
  }

  // Validate role sequence
  const expectedRoles = computeDefaultRoles(selectedDocuments, loanAmount);
  const selectedRoles = selectedSlots.map((slot) => slot.role);
  const roleValidation = validateApproverSequence(selectedRoles, expectedRoles);
  
  if (!roleValidation.valid) {
    message.error(roleValidation.message);
    return false;
  }

  // Check approver IDs are valid GUIDs
  if (!areApproverIdsValid(selectedSlots, GUID_REGEX)) {
    message.error(
      "One or more selected approvers have invalid IDs. Please reselect approvers and try again."
    );
    return false;
  }

  return true;
};

/**
 * Comprehensive pre-submission validation
 */
export const validateDeferralSubmission = (
  selectedCustomerId,
  customerNumber,
  dclNumber,
  selectedDocuments,
  dclFile,
  approverSlots,
  loanAmount,
  approverList
) => {
  // Validate customer
  if (!validateCustomer(selectedCustomerId, customerNumber)) return false;

  // Validate DCL number
  if (!validateDclNumber(dclNumber)) return false;

  // Validate documents
  if (!validateDocumentsSelected(selectedDocuments)) return false;

  // Validate DCL file
  if (!validateDclFileUploaded(dclFile)) return false;

  // Validate approvers
  if (!validateApprovers(approverSlots, selectedDocuments, loanAmount, approverList)) {
    return false;
  }

  return true;
};

/**
 * Validate customer search inputs
 */
export const validateCustomerSearch = (customerNumber, loanType) => {
  const errors = [];

  if (!customerNumber || !customerNumber.trim()) {
    errors.push("Please enter customer number");
  }

  if (!loanType) {
    errors.push("Please select loan type");
  }

  if (errors.length > 0) {
    message.error(errors[0]);
    return false;
  }

  return true;
};

/**
 * Validate DCL search input
 */
export const validateDclSearch = (searchDclNumber) => {
  if (!searchDclNumber || !searchDclNumber.trim()) {
    message.error("Please enter DCL number");
    return false;
  }
  return true;
};

/**
 * Validate comment entry
 */
export const validateComment = (comment) => {
  if (!comment || !comment.trim()) {
    message.error("Please enter a comment before posting");
    return false;
  }
  return true;
};
