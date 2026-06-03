/**
 * Actioned Module - Document Helper Hook
 * Manages document viewing and downloading
 */

import { message } from "antd";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";
import useProtectedFileFetcher from "../../../../hooks/useProtectedFileFetcher";

/**
 * useDocumentHandlers - Manages document file operations
 * @returns {Object} - {handleViewDocument, handleDownloadDocument}
 */
export const useDocumentHandlers = () => {
  const { openFile, downloadFile } = useProtectedFileFetcher();
  const handleViewDocument = (file) => {
    const fileUrl = file?.url || file?.fileUrl;
    if (!fileUrl) {
      message.info("No preview available");
      return;
    }

    openFile(fileUrl)
      .then(() => message.info(`Opening ${file?.name || "document"}`))
      .catch((err) => console.error("Failed to open file:", err));
  };

  const handleDownloadDocument = (file) => {
    const fileUrl = file?.url || file?.fileUrl;
    if (!fileUrl) {
      message.info("No file available for download");
      return;
    }

    downloadFile(fileUrl, file?.name || "download").catch((err) => {
      console.error("Failed to download file:", err);
      message.error("Failed to download file");
    });
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
