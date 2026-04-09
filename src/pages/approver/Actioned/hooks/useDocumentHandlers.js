/**
 * Actioned Module - Document Helper Hook
 * Manages document viewing and downloading
 */

import { message } from "antd";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";

/**
 * useDocumentHandlers - Manages document file operations
 * @returns {Object} - {handleViewDocument, handleDownloadDocument}
 */
export const useDocumentHandlers = () => {
  const handleViewDocument = (file) => {
    if (file && file.url) {
      window.open(file.url, "_blank");
      message.info(`Opening ${file.name || "document"}`);
    } else {
      message.info("No preview available");
    }
  };

  const handleDownloadDocument = (file) => {
    if (!file || !file.url) {
      message.info("No file available for download");
      return;
    }
    try {
      const a = document.createElement("a");
      a.href = file.url;
      a.download = file.name || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download file:", err);
      message.error("Failed to download file");
    }
  };

  return {
    handleViewDocument,
    handleDownloadDocument,
  };
};

/**
 * useDocumentBuckets - Gets bucketed documents from deferral
 * @param {Object} deferral - Deferral object
 * @returns {Object} - {dclDocs, uploadedDocs, requestedDocs}
 */
export const useDocumentBuckets = (deferral) => {
  return getDeferralDocumentBuckets(deferral);
};
