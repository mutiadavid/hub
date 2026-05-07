/**
 * Actioned Module - Document Helper Hook
 * Manages document viewing and downloading
 */

import { message } from "antd";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";
import { downloadFile, openFileInNewTab } from "../../../../utils/fileUtils";

/**
 * useDocumentHandlers - Manages document file operations
 * @returns {Object} - {handleViewDocument, handleDownloadDocument}
 */
export const useDocumentHandlers = () => {
  const handleViewDocument = (file) => {
    const fileUrl = file?.url || file?.fileUrl;
    if (!fileUrl) {
      message.info("No preview available");
      return;
    }

    openFileInNewTab(fileUrl);
    message.info(`Opening ${file?.name || "document"}`);
  };

  const handleDownloadDocument = (file) => {
    const fileUrl = file?.url || file?.fileUrl;
    if (!fileUrl) {
      message.info("No file available for download");
      return;
    }

    try {
      downloadFile(fileUrl, file?.name || "download");
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
