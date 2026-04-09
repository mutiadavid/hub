import React, { useState, useEffect } from "react";
import { Modal, Spin, message, Button } from "antd";
import { DownloadOutlined, CloseOutlined } from "@ant-design/icons";

const FileViewerModal = ({ open, fileName, fileUrl, onClose, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [fileType, setFileType] = useState("unknown");

  useEffect(() => {
    if (open && fileUrl) {
      loadFile();
    }
  }, [open, fileUrl]);

  const loadFile = async () => {
    try {
      setLoading(true);
      const ext = fileName.split(".").pop().toLowerCase();
      setFileType(ext);

      if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
        // Image file
        setContent(
          <div style={{ textAlign: "center" }}>
            <img
              src={fileUrl}
              alt={fileName}
              style={{ maxWidth: "100%", maxHeight: "500px" }}
            />
          </div>,
        );
      } else if (ext === "pdf") {
        // PDF - embed viewer
        setContent(
          <iframe
            src={fileUrl}
            style={{ width: "100%", height: "500px", border: "none" }}
            title={fileName}
          />,
        );
      } else if (["txt", "csv"].includes(ext)) {
        // Text file
        const response = await fetch(fileUrl);
        const text = await response.text();
        setContent(
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: "4px",
              maxHeight: "500px",
              overflowY: "auto",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            {text}
          </pre>,
        );
      } else {
        // Unsupported file type
        setContent(
          <div style={{ textAlign: "center", padding: "30px" }}>
            <p style={{ color: "#8C8C8C", marginBottom: "16px" }}>
              Preview not available for this file type (.{ext})
            </p>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={onDownload}
              style={{
                background: "linear-gradient(135deg, #1a5fa3 0%, #003d6b 100%)",
                borderColor: "#003d6b",
              }}
            >
              Download File
            </Button>
          </div>,
        );
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading file:", error);
      message.error("Failed to load file");
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#164679" }}>
            {fileName}
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onDownload}
          style={{
            background: "linear-gradient(135deg, #1a5fa3 0%, #003d6b 100%)",
            borderColor: "#003d6b",
          }}
        >
          Download
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : (
        content
      )}
    </Modal>
  );
};

export default FileViewerModal;
