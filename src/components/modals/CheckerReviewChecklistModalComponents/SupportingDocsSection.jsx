import React from "react";
import { Card, Tag, Space, Button } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const SupportingDocsSection = ({ supportingDocs }) => {
  if (!supportingDocs || supportingDocs.length === 0) return null;

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

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginTop: 12 }}>
        <h4 style={{ color: "#164679", fontSize: 14, marginBottom: 8 }}>
          📎 Supporting Documents & Other Uploads ({supportingDocs.length})
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {supportingDocs.map((doc) => (
            <Card
              key={doc.id || doc._id}
              size="small"
              style={{ borderRadius: 6 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {doc.fileName || doc.name}
                    </strong>
                    <Tag color={getRoleTagColor(doc.uploadedByRole)}>
                      {getRoleDisplayName(doc.uploadedByRole)}
                    </Tag>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#666",
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      📅 {dayjs(doc.uploadedAt).format("DD MMM YYYY HH:mm")}
                    </span>
                    {doc.fileSize && (
                      <span>📦 {(doc.fileSize / 1024).toFixed(2)} KB</span>
                    )}
                    {doc.fileType && <span>📄 {doc.fileType}</span>}
                  </div>
                </div>
                {doc.fileUrl && (
                  <Space>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(doc.fileUrl, "_blank")}
                    >
                      View
                    </Button>
                  </Space>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportingDocsSection;
