import { useCallback } from "react";
import { message } from "antd";
import { API_BASE_URL } from "../utils/constants";
import { openFileInNewTab } from "../utils/fileUtils";
// import dayjs from 'dayjs';

export const useDocumentHandlers = (docs, setDocs, isActionDisabled) => {
  const handleNameChange = useCallback(
    (idx, value) => {
      if (isActionDisabled) return;
      const updated = [...docs];
      updated[idx].name = value;
      setDocs(updated);
    },
    [docs, setDocs, isActionDisabled],
  );

  const handleActionChange = useCallback(
    (idx, value) => {
      if (isActionDisabled) return;
      const updated = [...docs];
      updated[idx].action = value;
      updated[idx].status = value;
      setDocs(updated);
    },
    [docs, setDocs, isActionDisabled],
  );

  const handleDeleteSupportingDoc = useCallback(
    async (docId, docName) => {
      if (isActionDisabled) return;

      const confirm = window.confirm(`Delete "${docName}"?`);
      if (!confirm) return;

      try {
        // You'll need to import apiUtils or use fetch directly
        const response = await fetch(`${API_BASE_URL}/api/uploads/${docId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          message.success("Document deleted!");
          return true; // Return true to indicate success
        } else {
          message.error(result.error || "Delete failed");
          return false;
        }
      } catch (error) {
        console.error("Delete error:", error);
        message.error("Delete error: " + error.message);
        return false;
      }
    },
    [isActionDisabled],
  );

  const handleDeferralNoChange = useCallback(
    (idx, value) => {
      if (isActionDisabled) return;
      const updated = [...docs];
      updated[idx].deferralNo = value;
      updated[idx].deferralNumber = value; // Keep both fields in sync
      setDocs(updated);
    },
    [docs, setDocs, isActionDisabled],
  );

  const handleCommentChange = useCallback(
    (idx, value) => {
      if (isActionDisabled) return;
      const updated = [...docs];
      updated[idx].comment = value;
      setDocs(updated);
    },
    [docs, setDocs, isActionDisabled],
  );

  const handleDelete = useCallback(
    (idx) => {
      if (isActionDisabled) return;
      const updated = docs
        .filter((_, i) => i !== idx)
        .map((doc, i) => ({ ...doc, docIdx: i }));
      setDocs(updated);
      message.success("Document deleted.");
    },
    [docs, setDocs, isActionDisabled],
  );

  const handleExpiryDateChange = useCallback(
    (idx, date) => {
      if (isActionDisabled) return;
      const updated = [...docs];
      updated[idx].expiryDate = date ? date.toISOString() : null;
      setDocs(updated);
    },
    [docs, setDocs, isActionDisabled],
  );

  const handleViewFile = useCallback((record) => {
    const fileUrl = record.fileUrl || record.uploadData?.fileUrl;
    if (!fileUrl) {
      message.warning("No file available to view");
      return;
    }

    openFileInNewTab(fileUrl);
  }, []);

  return {
    handleNameChange,
    handleActionChange,
    handleCommentChange,
    handleDeferralNoChange,
    handleDelete,
    handleExpiryDateChange,
    handleViewFile,
    handleDeleteSupportingDoc,
  };
};
