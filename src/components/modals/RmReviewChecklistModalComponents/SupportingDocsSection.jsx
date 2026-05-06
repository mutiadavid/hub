import React from "react";
import { Card, Button, Space, Tag } from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { openFileInNewTab } from "../../../utils/fileUtils";

const SupportingDocsSection = ({
  supportingDocs,
  handleDeleteSupportingDoc,
  isActionAllowed,
  readOnly,
  title = "RM Uploaded Supporting Documents",
}) => {
  if (!supportingDocs || supportingDocs.length === 0) {
    return null;
  }

  // Function to get role tag color
  const getRoleTagColor = (role) => {
    switch (role?.toLowerCase()) {
      case "rm":
        return "orange";
      case "co_creator":
        return "blue";
      case "checker":
        return "purple";
      default:
        return "default";
    }
  };

  // Function to get role display name
  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case "rm":
        return "RM Upload";
      case "co_creator":
        return "CO Upload";
      case "checker":
        return "Checker Upload";
      default:
        return "Supporting";
    }
  };

  // 🔹 NEW: Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginTop: 12 }}>
        {/* 🔹 CHANGED: Title is now dynamic and includes count */}
        <h4
          style={{
            color: "#164679",
            fontSize: 14,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>📎 {title}</span>
          <Tag color="blue" style={{ borderRadius: "12px" }}>
            {supportingDocs.length}
          </Tag>
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {supportingDocs.map((doc) => (
            <Card
              size="small"
              key={doc._id || doc.id}
              style={{
                borderRadius: 6,
                // 🔹 NEW: Add left border to visually distinguish RM uploads
                borderLeft: doc.uploadedByRole === 'rm' ? '3px solid #164679' : 'none'
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {doc.fileName || doc.name}
                    </strong>
                    <Tag
                      size="small"
                      color={getRoleTagColor(doc.uploadedByRole)}
                    >
                      {getRoleDisplayName(doc.uploadedByRole)}
                    </Tag>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#666",
                      marginTop: 2,
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      📅 {dayjs(doc.uploadedAt || doc.createdAt).format("DD MMM YYYY HH:mm")}
                    </span>
                    {/* 🔹 IMPROVED: Better file size formatting */}
                    {doc.fileSize && (
                      <span>📦 {formatFileSize(doc.fileSize) || (doc.fileSize / 1024).toFixed(2) + " KB"}</span>
                    )}
                    {doc.fileType && <span>📄 {doc.fileType}</span>}
                  </div>
                  {/* 🔹 NEW: Show uploader info if available */}
                  {doc.uploadedBy?.name && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                      👤 Uploaded by: {doc.uploadedBy.name}
                    </div>
                  )}
                </div>
                <Space>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() =>
                      openFileInNewTab(doc.fileUrl || doc.uploadData?.fileUrl)
                    }
                  >
                    View
                  </Button>
                  {!readOnly && (doc.canDelete === undefined || doc.canDelete) && (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        handleDeleteSupportingDoc(
                          doc._id || doc.uploadData?._id || doc.id,
                          doc.fileName || doc.name,
                        )
                      }
                      disabled={!isActionAllowed}
                    >
                      Delete
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportingDocsSection;

