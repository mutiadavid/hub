import { message, Typography } from "antd";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { ERROR_RED, PRIMARY_BLUE, SUCCESS_GREEN, WARNING_ORANGE } from "./constants";
import React from "react";
import { Button, Tooltip } from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import "../../../../styles/creatorDesignSystem.css";

const resolveFileName = (fileOrName) => {
  if (typeof fileOrName === "string") {
    return fileOrName;
  }

  if (!fileOrName || typeof fileOrName !== "object") {
    return "document";
  }

  return (
    fileOrName.name ||
    fileOrName.fileName ||
    fileOrName.title ||
    fileOrName.originalName ||
    "document"
  );
};

/**
 * Get appropriate file icon based on file extension
 */
export const getFileIcon = (fileName) => {
  const normalizedFileName = resolveFileName(fileName);
  const extension = normalizedFileName.includes(".")
    ? normalizedFileName.split(".").pop().toLowerCase()
    : "";

  switch (extension) {
    case "pdf":
      return <FilePdfOutlined style={{ color: ERROR_RED }} />;
    case "doc":
    case "docx":
      return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
    case "xls":
    case "xlsx":
      return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
    case "png":
    case "jpg":
    case "jpeg":
      return <FileImageOutlined style={{ color: WARNING_ORANGE }} />;
    default:
      return <FileOutlined />;
  }
};

/**
 * Convert a File object to a data URL
 */
export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    try {
      const f = file.originFileObj || file;
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(f);
    } catch (err) {
      reject(err);
    }
  });

/**
 * Handle viewing a document
 */
export const handleViewDocument = (file) => {
  if (file && file.originFileObj) {
    const fileURL = URL.createObjectURL(file.originFileObj);
    window.open(fileURL, "_blank");
    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 10000);
    message.info(`Opening ${resolveFileName(file)}`);
  } else if (file && file instanceof File) {
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, "_blank");
    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 10000);
    message.info(`Opening ${resolveFileName(file)}`);
  } else if (file && file.url) {
    window.open(file.url, "_blank");
    message.info(`Opening ${resolveFileName(file)}`);
  } else {
    message.info("This draft restored without a local file copy. Please re-upload to preview.");
  }
};

/**
 * Handle downloading a document
 */
export const handleDownload = (item) => {
  if (!item) return message.info("No file available");

  if (
    item.fileObj &&
    (item.fileObj instanceof File || item.fileObj.originFileObj)
  ) {
    const blob = item.fileObj.originFileObj
      ? item.fileObj.originFileObj
      : item.fileObj;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = blob.name || item.name || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  if (item.url) {
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.name || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  message.info("No file available for download");
};

/**
 * Render a document list item with view and delete actions
 */
export const renderDocumentItem = (file, allowDelete = true, onDelete = null) => {
  const fileName = resolveFileName(file);
  const fileSize = file.size
    ? `${(file.size / 1024).toFixed(2)} KB`
    : "Size unknown";

  return (
    <div
      className="deferral-document-item"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        border: "1px solid rgba(214, 189, 152, 0.16)",
        borderRadius: "8px",
        marginBottom: "8px",
        backgroundColor: "rgba(245, 247, 244, 0.7)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {getFileIcon(fileName)}
        <div>
          <Typography.Text strong style={{ display: "block", fontSize: "13px", color: "var(--color-text-dark)" }}>
            {fileName}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: "11px", color: "var(--color-text-light)" }}>
            {fileSize}
          </Typography.Text>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <Tooltip title="View document">
          <Button
            type="text"
            size="small"
            className="deferral-document-action-btn"
            icon={<EyeOutlined style={{ color: PRIMARY_BLUE }} />}
            onClick={() => handleViewDocument(file)}
          />
        </Tooltip>
        {allowDelete && (
          <Tooltip title="Delete document">
            <Button
              type="text"
              size="small"
              className="deferral-document-action-btn"
              icon={<DeleteOutlined />}
              onClick={() => onDelete && onDelete(file)}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

/**
 * Download file helper
 */
export const downloadFile = (url, filename) => {
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to download file:", err);
  }
};
