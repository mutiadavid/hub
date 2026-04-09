import { useState, useRef } from "react";

/**
 * Custom hook for managing extension application modal state
 * @returns {object} Extension modal state and control functions
 */
export const useExtensionModal = () => {
  const [selectedDeferralForExtension, setSelectedDeferralForExtension] =
    useState(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extensionDays, setExtensionDays] = useState("");
  const [extensionDaysByDoc, setExtensionDaysByDoc] = useState({});
  const [extensionComment, setExtensionComment] = useState("");
  const [extensionFiles, setExtensionFiles] = useState([]);
  const [extensionSubmitting, setExtensionSubmitting] = useState(false);
  const [extensionSubmissionSuccess, setExtensionSubmissionSuccess] =
    useState(false);
  const [extensionDetails, setExtensionDetails] = useState(null);
  const extensionPollRef = useRef(null);

  const resetExtensionState = () => {
    setExtensionModalOpen(false);
    setSelectedDeferralForExtension(null);
    setExtensionDays("");
    setExtensionComment("");
    setExtensionFiles([]);
    setExtensionDaysByDoc({});
    setExtensionSubmissionSuccess(false);
  };

  return {
    selectedDeferralForExtension,
    setSelectedDeferralForExtension,
    extensionModalOpen,
    setExtensionModalOpen,
    extensionDays,
    setExtensionDays,
    extensionDaysByDoc,
    setExtensionDaysByDoc,
    extensionComment,
    setExtensionComment,
    extensionFiles,
    setExtensionFiles,
    extensionSubmitting,
    setExtensionSubmitting,
    extensionSubmissionSuccess,
    setExtensionSubmissionSuccess,
    extensionDetails,
    setExtensionDetails,
    extensionPollRef,
    resetExtensionState,
  };
};
