import { useState, useRef, useCallback } from "react";
import { message } from "antd";
import { isValidFileType } from "../utils/helpers";

/**
 * Custom hook to manage document selection and file uploads
 */
export const useDocuments = () => {
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [dclFile, setDclFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [perDocumentDays, setPerDocumentDays] = useState({});

  const handlePerDocumentDaysChange = useCallback((docKey, value) => {
    const v = value === null || value === undefined ? undefined : Number(value);
    setPerDocumentDays((prev) => ({ ...prev, [docKey]: v }));
  }, []);

  const handleDCLUpload = useCallback((file) => {
    if (!isValidFileType(file.name)) {
      message.error(
        "File type not allowed. Please upload: .pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg"
      );
      return false;
    }

    setDclFile(file);
    message.success(`${file.name} selected for DCL upload`);
    return false;
  }, []);

  const handleAdditionalFileUpload = useCallback((file) => {
    if (!isValidFileType(file.name)) {
      message.error(
        "File type not allowed. Please upload: .pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg"
      );
      return false;
    }

    const newFileList = [...additionalFiles, file];
    setAdditionalFiles(newFileList);
    message.success(`${file.name} added to additional documents`);
    return false;
  }, [additionalFiles]);

  const removeDCLFile = useCallback(() => {
    setDclFile(null);
    message.info("DCL file removed");
  }, []);

  const removeAdditionalFile = useCallback((file) => {
    const newFileList = additionalFiles.filter((f) => f.uid !== file.uid);
    setAdditionalFiles(newFileList);
    message.info(`${file.name} removed`);
  }, [additionalFiles]);

  // Initialize per-document days when selected documents change
  const initializePerDocumentDays = useCallback(() => {
    if (!selectedDocuments || selectedDocuments.length === 0) {
      setPerDocumentDays((prev) => {
        const hasKeys = Object.keys(prev).length > 0;
        return hasKeys ? {} : prev;
      });
      return;
    }

    setPerDocumentDays((prev) => {
      const next = {};
      selectedDocuments.forEach((doc, idx) => {
        const key =
          doc && (doc._id || doc.name) ? doc._id || doc.name : String(idx);
        next[key] = prev[key] ?? 0;
      });

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const unchanged =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key]);

      return unchanged ? prev : next;
    });
  }, [selectedDocuments]);

  return {
    selectedDocuments,
    setSelectedDocuments,
    dclFile,
    setDclFile,
    additionalFiles,
    setAdditionalFiles,
    perDocumentDays,
    handlePerDocumentDaysChange,
    handleDCLUpload,
    handleAdditionalFileUpload,
    removeDCLFile,
    removeAdditionalFile,
    initializePerDocumentDays,
  };
};
