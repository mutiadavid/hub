import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Modal,
  Input,
  Space,
  Upload,
  message,
  Card,
  Descriptions,
  Spin,
  DatePicker,
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  FileOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_ORIGIN } from "../../../config/runtimeConfig";
import { getExpiryMeta } from "../../../utils/documentUtils";
import { openFileInNewTab } from "../../utils/fileUtils";
import useProtectedFileFetcher from "../../hooks/useProtectedFileFetcher";

const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";

const customStyles = `
  .ant-modal-header { background-color: white !important; color: ${PRIMARY_BLUE} !important; }
  .status-tag { font-weight: 700; border-radius: 999px; padding: 3px 8px; text-transform: capitalize; display: inline-flex; align-items: center; gap: 4px; }
  .ant-input, .ant-input-textarea { border-radius: 6px !important; }
  .doc-table .ant-table-tbody > tr > td { border-bottom: 1px dashed #f0f0f0 !important; }
  .ant-upload-list-item {
    border-radius: 6px !important;
    margin-top: 8px !important;
  }
`;

const CreatorQueueChecklistModal = ({ checklist, open, onClose }) => {
  const [docs, setDocs] = useState([]);
  const [checkerComment, setCheckerComment] = useState("");
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { openFile } = useProtectedFileFetcher();

  const API_BASE_URL = API_ORIGIN;

  // Helper to ensure file URL includes the base URL
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    const flattenedDocs = checklist.documents.reduce((acc, catObj) => {
      const categoryDocs = catObj.docList.map((doc, index) => ({
        ...doc,
        category: catObj.category,
        docIdx: acc.length + index,
        status: doc.status || "pendingChecker",
      }));
      return acc.concat(categoryDocs);
    }, []);

    setDocs(flattenedDocs);
  }, [checklist]);

  const handleDocStatusChange = (docIdx, newStatus) => {
    const updated = [...docs];
    updated[docIdx].status = newStatus;
    setDocs(updated);
  };

  const handleAdditionalUpload = (file) => {
    const fileName = file.name || `Document_${Date.now()}`;
    const fileSize = file.size;
    const fileType =
      file.type || file.name?.split(".").pop()?.toUpperCase() || "FILE";

    const fileWithPreview = {
      uid: file.uid || `additional-${Date.now()}-${Math.random()}`,
      name: fileName,
      size: fileSize,
      type: fileType,
      originalFile: file,
      url: URL.createObjectURL(file),
      status: "done",
      uploadedAt: new Date().toISOString(),
    };

    setAdditionalFiles((prev) => [...prev, fileWithPreview]);
    message.success(`File uploaded: ${fileName}`);
    return false;
  };

  const removeFile = (file) => {
    setAdditionalFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    message.success(`File removed: ${file.name}`);
  };

  const submitCheckerAction = async (action) => {
    if (!checkerComment.trim()) {
      return message.error("Please enter a comment before submitting.");
    }

    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const successMessage =
        action === "returned"
          ? "Checklist returned to RM successfully!"
          : "Checklist submitted to Checker successfully!";

      message.success(successMessage);

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      message.error("Failed to submit checklist.");
      setSubmitting(false);
    }
  };

  const downloadChecklist = () => {
    let content = `Checklist: ${checklist.title}\n\nDocuments:\n`;
    docs.forEach((doc) => {
      content += `- ${doc.name} (${doc.category}) - ${doc.status}\n`;
    });

    if (additionalFiles.length > 0) {
      content += `\nAdditional Files:\n`;
      additionalFiles.forEach((file) => {
        content += `- ${file.name} (${file.size ? Math.round(file.size / 1024) : "?"} KB)\n`;
      });
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Checklist_${checklist.id || checklist._id}.txt`;
    link.click();
    message.success("Checklist downloaded");
  };

  const total = docs.length;
  const pending = docs.filter((d) => d.status === "pendingChecker").length;
  const approved = docs.filter((d) => d.status === "approved").length;
  const rejected = docs.filter((d) => d.status === "rejected").length;
  const progressPercent =
    total === 0 ? 0 : Math.round((approved / total) * 100);

  const columns = [
    {
      title: "Document Name",
      dataIndex: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (text) => (
        <span style={{ color: SECONDARY_PURPLE, fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: "RM Comment",
      dataIndex: "comment",
      render: (text) => text || "-",
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      render: (_, record) => {
        if (record.category !== "Compliance Documents") return "-";

        const expiryMeta = getExpiryMeta(record.expiryDate);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
            <DatePicker
              value={record.expiryDate ? dayjs(record.expiryDate) : null}
              onChange={(date) => {
                const updated = [...docs];
                updated[record.docIdx].expiryDate = date
                  ? date.toISOString()
                  : null;
                setDocs(updated);
              }}
              disabled={submitting}
              style={{ width: 160, fontSize: 13 }}
              size="middle"
            />
            {expiryMeta ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  color: expiryMeta.isExpired ? "#b42318" : "#237804",
                }}
              >
                {expiryMeta.label} • {expiryMeta.detail}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        let color = LIGHT_YELLOW;
        let text = status;
        if (status === "pendingChecker") {
          color = ACCENT_LIME;
          text = "Pending";
        } else if (status === "approved") {
          color = ACCENT_LIME;
          text = "Approved";
        } else if (status === "rejected") {
          color = HIGHLIGHT_GOLD;
          text = "Rejected";
        }
        return (
          <Tag className="status-tag" style={{ color, borderColor: color }}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space size={4}>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() =>
              openFile(record.fileUrl || record.uploadData?.fileUrl).catch((err) => console.error(err))
            }
            disabled={!(record.fileUrl || record.uploadData?.fileUrl)}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => handleDocStatusChange(record.docIdx, "approved")}
            disabled={submitting || record.status === "approved"}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDocStatusChange(record.docIdx, "rejected")}
            disabled={submitting || record.status === "rejected"}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const allDocsApproved =
    docs.length > 0 && docs.every((doc) => doc.status === "approved");

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (fileName, fileType) => {
    if (fileType && fileType !== "FILE") {
      return fileType.toUpperCase();
    }
    if (fileName) {
      const extension = fileName.split(".").pop().toUpperCase();
      return extension === fileName ? "FILE" : extension;
    }
    return "FILE";
  };

  const customRequest = ({ file, onSuccess }) => {
    setTimeout(() => onSuccess("ok"), 0);
  };

  const uploadProps = {
    customRequest,
    beforeUpload: handleAdditionalUpload,
    multiple: true,
    showUploadList: false,
    disabled: submitting,
  };

  return (
    <>
      <style>{customStyles}</style>
      <Modal
        title={`Review Checklist — ${checklist?.title || ""}`}
        open={open}
        onCancel={() => {
          if (!submitting) onClose();
        }}
        width={1000}
        centered={false}
        wrapperClassName="modal-centered-in-content"
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={downloadChecklist}
            disabled={submitting}
          >
            Download Checklist
          </Button>,
          <Button
            key="return"
            type="default"
            onClick={() => submitCheckerAction("returned")}
            loading={submitting}
          >
            Return to RM
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => submitCheckerAction("approved")}
            disabled={!allDocsApproved || submitting}
            loading={submitting}
          >
            Submit to Checker
          </Button>,
        ]}
        closable={!submitting}
        maskClosable={!submitting}
      >
        {submitting && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Spin size="large" />
              <div
                style={{
                  marginTop: 16,
                  fontWeight: "bold",
                  color: PRIMARY_BLUE,
                }}
              >
                Submitting checklist...
              </div>
            </div>
          </div>
        )}

        <Card size="small">
          <Descriptions column={2}>
            <Descriptions.Item label="DCL No">
              <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
                {checklist?.dclNo || checklist?._id}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Title">
              {checklist?.title}
            </Descriptions.Item>
            <Descriptions.Item label="Loan Type">
              {checklist?.loanType}
            </Descriptions.Item>
            <Descriptions.Item label="Created By">
              {checklist?.createdBy?.name}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <div
          style={{
            padding: "16px",
            background: "#f7f9fc",
            borderRadius: 8,
            border: "1px solid #e0e0e0",
            margin: "16px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
              Total Documents: {total}
            </div>
            <div style={{ fontWeight: "700", color: SECONDARY_PURPLE }}>
              Pending: {pending}
            </div>
            <div style={{ fontWeight: "700", color: ACCENT_LIME }}>
              Approved: {approved}
            </div>
            <div style={{ fontWeight: "700", color: "#ff4d4f" }}>
              Rejected: {rejected}
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: 12,
              background: "#e0e0e0",
              borderRadius: 50,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: PRIMARY_BLUE,
                borderRadius: 50,
                transition: "width 0.4s ease",
              }}
            ></div>
          </div>

          <div
            style={{
              textAlign: "right",
              marginTop: 4,
              fontWeight: "700",
              color: PRIMARY_BLUE,
            }}
          >
            {progressPercent}%
          </div>
        </div>

        <h3 style={{ marginTop: 16, color: PRIMARY_BLUE }}>Documents</h3>
        <Table
          rowKey="docIdx"
          columns={columns}
          dataSource={docs}
          pagination={false}
          style={{ marginBottom: 16 }}
        />

        <h3 style={{ marginTop: 16, color: PRIMARY_BLUE }}>
          Creator General Comment
        </h3>
        <Input.TextArea
          rows={4}
          value={checkerComment}
          onChange={(e) => setCheckerComment(e.target.value)}
          placeholder="Enter your comments for the checklist..."
          style={{ marginBottom: 12 }}
          disabled={submitting}
        />

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <h4 style={{ color: PRIMARY_BLUE, marginBottom: 8 }}>
            <PaperClipOutlined style={{ marginRight: 8 }} />
            Additional Supporting Documents
          </h4>
          <div
            style={{
              fontSize: 12,
              color: "#666",
              marginBottom: 12,
              padding: "8px 12px",
              background: "#f5f5f5",
              borderRadius: 4,
            }}
          >
            Upload any supporting documents not included in the original
            checklist
          </div>
        </div>

        <Upload {...uploadProps}>
          <Button
            icon={<UploadOutlined />}
            disabled={submitting}
            style={{ marginBottom: 8 }}
          >
            Click to Upload Supporting Documents
          </Button>
        </Upload>

        {additionalFiles.length > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: "16px",
              background: "#f8f9fa",
              borderRadius: 6,
              border: "1px solid #e9ecef",
            }}
          >
            <div
              style={{
                color: PRIMARY_BLUE,
                fontWeight: 600,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PaperClipOutlined />
                <span>Supporting Documents ({additionalFiles.length})</span>
              </div>
              <Tag color="blue" style={{ fontWeight: 500 }}>
                {additionalFiles.length} file
                {additionalFiles.length !== 1 ? "s" : ""}
              </Tag>
            </div>

            <div
              style={{ maxHeight: "200px", overflowY: "auto", paddingRight: 4 }}
            >
              {additionalFiles.map((file, index) => {
                const fileType = getFileType(file.name, file.type);
                const fileSize = formatFileSize(file.size);
                const uploadTime = file.uploadedAt
                  ? new Date(file.uploadedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Just now";

                return (
                  <div
                    key={file.uid || index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      marginBottom: 8,
                      background: "white",
                      borderRadius: 4,
                      border: "1px solid #dee2e6",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 4,
                          background: PRIMARY_BLUE + "15",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileOutlined
                          style={{ color: PRIMARY_BLUE, fontSize: 18 }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#333",
                            fontSize: 14,
                            marginBottom: 2,
                          }}
                        >
                          {file.name || `Document ${index + 1}`}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6c757d",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {fileSize !== "0 Bytes" && (
                            <>
                              <span>{fileSize}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>Type: {fileType}</span>
                          <span>•</span>
                          <span>Uploaded: {uploadTime}</span>
                        </div>
                      </div>
                    </div>

                    <Space size={8}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          if (file.url) {
                            window.open(file.url, "_blank");
                          } else {
                            message.warning(
                              `Preview not available for ${file.name}`,
                            );
                          }
                        }}
                        disabled={submitting || !file.url}
                        title="Preview file"
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          if (file.url) {
                            const link = document.createElement("a");
                            link.href = file.url;
                            link.download =
                              file.name || `document_${index + 1}`;
                            link.click();
                            message.success(
                              `Downloading ${file.name || "document"}`,
                            );
                          }
                        }}
                        disabled={submitting || !file.url}
                        title="Download file"
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFile(file)}
                        disabled={submitting}
                        title="Remove file"
                      />
                    </Space>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CreatorQueueChecklistModal;
