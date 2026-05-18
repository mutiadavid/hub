import React from "react";
import {
  Table,
  Space,
  Button,
  Upload,
  Select,
  Input,
  Tooltip,
  Popover,
  message,
  Modal,
  List,
  Popconfirm,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { openFileInNewTab } from "../../../utils/fileUtils";
import { getExpiryMeta, getExpiryStatus } from "../../../utils/documentStats";
import { formatStatusForSnakeCase } from "../../../utils/statusColors";
import { API_ORIGIN } from "../../../config/runtimeConfig";
import "../../../styles/creatorDesignSystem.css";

const cardFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
const gray700 = "#374151";

const isDeferralRequestedStatus = (status) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return normalized === "deferralrequested" || normalized === "defferalrequested";
};

const isNaStatus = (status) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return normalized === "na";
};

const getStatusTextColor = (status) => {
  const normalizedStatus = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "");

  if (
    normalizedStatus.includes("submitted") ||
    normalizedStatus.includes("approved") ||
    normalizedStatus.includes("sighted") ||
    normalizedStatus.includes("submittedforreview")
  ) {
    return "#52C41A";
  }

  if (
    normalizedStatus.includes("deferred") ||
    normalizedStatus.includes("waived") ||
    normalizedStatus.includes("tbo") ||
    normalizedStatus.includes("deferralrequested")
  ) {
    return "#FAAD14";
  }

  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("rejected")
  ) {
    return "#FF4D4F";
  }

  if (isNaStatus(status)) {
    return "#6b7280";
  }

  return gray700;
};

const DocumentTable = ({
  docs,
  setDocs,
  onEdit,
  isActionAllowed,
  handleFileUpload,
  readOnly,
  deferralValidationByDoc = {},
  onValidateDeferralNumber,
  onDeferralNumberEdit,
  onClearDeferralValidation,
  token,
  checklist,
}) => {
  const [openDeferralPopoverDoc, setOpenDeferralPopoverDoc] = React.useState(null);
  const [transientValidationByDoc, setTransientValidationByDoc] = React.useState({});
  const [viewModalFiles, setViewModalFiles] = React.useState(null);
  const transientValidationTimersRef = React.useRef({});
  const previousValidationRef = React.useRef({});

  const canActOnDoc = (doc) => {
    const docStatus = (doc.status || "").toLowerCase();
    return isActionAllowed && docStatus === "pendingrm";
  };

  React.useEffect(() => {
    const currentTimers = transientValidationTimersRef.current;

    Object.entries(deferralValidationByDoc || {}).forEach(([docKey, validationState]) => {
      if (!validationState) {
        return;
      }

      const previousValidation = previousValidationRef.current[docKey];
      const nextSignature = JSON.stringify({
        status: validationState.status,
        message: validationState.message,
        expiryDateText: validationState.expiryDateText,
      });
      const previousSignature = previousValidation
        ? JSON.stringify({
          status: previousValidation.status,
          message: previousValidation.message,
          expiryDateText: previousValidation.expiryDateText,
        })
        : null;

      if (
        nextSignature !== previousSignature &&
        !["idle", "validating"].includes(validationState.status) &&
        (validationState.message || validationState.expiryDateText)
      ) {
        setTransientValidationByDoc((prev) => ({
          ...prev,
          [docKey]: {
            status: validationState.status,
            message: validationState.message,
            expiryDateText: validationState.expiryDateText,
          },
        }));

        if (transientValidationTimersRef.current[docKey]) {
          clearTimeout(transientValidationTimersRef.current[docKey]);
        }

        transientValidationTimersRef.current[docKey] = setTimeout(() => {
          setTransientValidationByDoc((prev) => {
            const next = { ...prev };
            delete next[docKey];
            return next;
          });
        }, 4000);
      }

      previousValidationRef.current[docKey] = validationState;
    });

    return () => {
      Object.values(currentTimers).forEach((timerId) => {
        clearTimeout(timerId);
      });
    };
  }, [deferralValidationByDoc]);

  const handleRmStatusChange = (docIdx, newRmStatus) => {
    if (typeof onEdit === "function") {
      onEdit();
    }

    setDocs((prev) =>
      prev.map((doc, idx) =>
        idx === docIdx
          ? { ...doc, rmStatus: newRmStatus, rmTouched: true }
          : doc,
      ),
    );
  };

  const handleDeferralNumberChange = (docIdx, value) => {
    if (typeof onEdit === "function") {
      onEdit();
    }

    setDocs((prev) =>
      prev.map((doc, idx) =>
        idx === docIdx
          ? { ...doc, deferralNumber: value, deferralNo: value }
          : doc,
      ),
    );

    if (typeof onDeferralNumberEdit === "function") {
      onDeferralNumberEdit(docIdx, value);
    }
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 150,
      render: (text) => (
        <span
          style={{
            fontSize: 12,
            color: "var(--color-text-body)",
            fontWeight: 500,
            lineHeight: 1.45,
            display: "block",
            whiteSpace: "normal",
            wordBreak: "break-word",
            fontFamily: cardFontFamily,
          }}
        >
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 240,
      render: (text) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text || "N/A"}
          disabled
          style={{ fontSize: 12, resize: "none", color: gray700, opacity: 0.72 }}
        />
      ),
    },
    {
      title: "Creator Status",
      width: 118,
      render: (_, record) => {
        const label =
          record.status === "deferred" && record.deferralNumber
            ? `Deferred (${record.deferralNumber})`
            : record.status;

        return (
          <Tooltip title={label}>
            <span
              className="doc-table-status-text"
              style={{
                color: getStatusTextColor(label),
                fontWeight: 600,
                fontSize: 12,
                textTransform: "capitalize",
                opacity: 0.72,
                fontFamily: cardFontFamily,
              }}
            >
              {formatStatusForSnakeCase(label || "pending")}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Creator Comment",
      dataIndex: "comment",
      width: 180,
      render: (text) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          disabled
          style={{ fontSize: 12, resize: "none", color: gray700, opacity: 0.72 }}
        />
      ),
    },
    {
      title: "Expiry Status",
      width: 150,
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();

        if (category !== "compliance documents") {
          return "-";
        }

        const status = getExpiryStatus(record.expiryDate);
        const expiryMeta = getExpiryMeta(record.expiryDate);

        if (!status || !expiryMeta) return "No expiry set";

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 104 }}>
            <Tooltip title={expiryMeta.label}>
              <span
                style={{
                  color: status === "current" ? "#237804" : "#b42318",
                  fontWeight: 600,
                  fontSize: 11,
                  lineHeight: 1.1,
                }}
              >
                {expiryMeta.label}
              </span>
            </Tooltip>
            <span
              style={{
                color: expiryMeta.isExpired ? "#cf1322" : "#237804",
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              {expiryMeta.detail}
            </span>
          </div>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 170,
      render: (_, record) => {
        const rmStatus = (record.rmStatus || "").toLowerCase();
        const status = (record.status || "").toLowerCase();
        const deferralNum = record.deferralNo || record.deferralNumber;

        if (
          deferralNum &&
          (rmStatus.includes("deferral") || status === "deferred")
        ) {
          return (
            <Tooltip title={`Deferral No: ${deferralNum}`}>
              <span
                className="doc-table-status-text"
                style={{
                  color: "#b45309",
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  fontFamily: cardFontFamily,
                }}
              >
                {deferralNum}
              </span>
            </Tooltip>
          );
        }

        return "-";
      },
    },
    {
      title: "RM Action",
      width: 260,
      render: (_, record) => {
        const isRestrictedCOStatus = [
          "submitted",
          "tbo",
          "waived",
          "sighted",
          "deferred",
          "pendingco",
        ].includes((record.status || "").toLowerCase());
        const validationState = deferralValidationByDoc?.[record.docIdx];
        const showDeferralInput = isDeferralRequestedStatus(record.rmStatus);
        const showNaHint = isNaStatus(record.rmStatus);
        const transientValidation = transientValidationByDoc?.[record.docIdx];

        const deferralPopoverContent = (
          <div style={{ width: 180, display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: gray700,
                fontFamily: cardFontFamily,
              }}
            >
              Deferral Number
            </div>
            <Input
              size="small"
              placeholder="Enter deferral no"
              value={record.deferralNumber || ""}
              status={validationState?.status === "invalid" ? "error" : ""}
              onChange={(e) =>
                handleDeferralNumberChange(record.docIdx, e.target.value)
              }
              onBlur={() =>
                onValidateDeferralNumber?.(
                  record.docIdx,
                  record.deferralNumber || "",
                )
              }
              disabled={!canActOnDoc(record)}
              autoFocus
              style={{ fontSize: 12 }}
            />

            {transientValidation && (
              <div
                style={{
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12,
                  lineHeight: 1.4,
                  background:
                    transientValidation.status === "valid" ? "#f6ffed" : "#fff1f0",
                  color:
                    transientValidation.status === "valid" ? "#237804" : "#cf1322",
                  border:
                    transientValidation.status === "valid"
                      ? "1px solid #b7eb8f"
                      : "1px solid #ffccc7",
                }}
              >
                {transientValidation.message ? <div>{transientValidation.message}</div> : null}
                {transientValidation.expiryDateText ? (
                  <div>Expiry date: {transientValidation.expiryDateText}</div>
                ) : null}
              </div>
            )}
          </div>
        );

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "nowrap",
                minWidth: 0,
              }}
            >
              <Popover
                content={deferralPopoverContent}
                trigger="click"
                placement="bottomLeft"
                open={openDeferralPopoverDoc === record.docIdx && showDeferralInput}
                onOpenChange={(open) => {
                  setOpenDeferralPopoverDoc((currentDocIdx) => {
                    if (open) {
                      return record.docIdx;
                    }

                    return currentDocIdx === record.docIdx ? null : currentDocIdx;
                  });
                }}
              >
                <Select
                  size="small"
                  placeholder="Select RM action"
                  value={record.rmStatus || undefined}
                  onChange={(val) => {
                    handleRmStatusChange(record.docIdx, val);

                    if (!isDeferralRequestedStatus(val)) {
                      onClearDeferralValidation?.(record.docIdx);
                      setOpenDeferralPopoverDoc((currentDocIdx) =>
                        currentDocIdx === record.docIdx ? null : currentDocIdx,
                      );
                    } else {
                      setOpenDeferralPopoverDoc(record.docIdx);
                      if (record.deferralNumber) {
                        onDeferralNumberEdit?.(record.docIdx, record.deferralNumber);
                      }
                    }
                  }}
                  disabled={!canActOnDoc(record)}
                  options={[
                    {
                      value: "deferral_requested",
                      label: "deferral_requested",
                    },
                    {
                      value: "submitted_for_review",
                      label: "submitted_for_review",
                    },
                    {
                      value: "pending_from_customer",
                      label: "pending_from_customer",
                    },
                    {
                      value: "N/A",
                      label: "N/A",
                    },
                  ]}
                  style={{ flex: 1, minWidth: 0 }}
                />
              </Popover>

              {/* Files view and Upload */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                {(() => {
                  const uploads = Array.isArray(record.uploads) ? record.uploads : [];
                  const files = [...uploads];

                  if (files.length === 0 && record.fileUrl) {
                    files.push({
                      id: "legacy",
                      fileUrl: record.fileUrl,
                      fileName: record.fileName || record.name || "Document File",
                      uploadedBy: record.uploadedBy,
                      uploadedByRole: record.uploadedByRole,
                      createdAt: record.uploadedAt,
                    });
                  }

                  if (files.length === 0) {
                    return <span style={{ color: "#94a3b8", fontSize: 11 }}>No files uploaded</span>;
                  }

                  if (files.length === 1) {
                    return (
                      <Button
                        size="small"
                        onClick={() => openFileInNewTab(files[0].fileUrl)}
                        style={{
                          backgroundColor: "#ffffff",
                          borderColor: "#d9d9d9",
                          color: "#333",
                          borderRadius: 6,
                          padding: "0 8px",
                          fontSize: 11,
                          height: 26,
                        }}
                      >
                        View
                      </Button>
                    );
                  }

                  return (
                    <Button
                      size="small"
                      onClick={() => setViewModalFiles({ files, record })}
                      style={{
                        backgroundColor: "#ffffff",
                        borderColor: "#10b981",
                        color: "#10b981",
                        borderRadius: 6,
                        padding: "0 8px",
                        fontSize: 11,
                        height: 26,
                      }}
                    >
                      View ({files.length} Files)
                    </Button>
                  );
                })()}

                {!readOnly && (
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleFileUpload(record.docIdx, file);
                      return false;
                    }}
                    disabled={!isActionAllowed || isRestrictedCOStatus}
                  >
                    <Button
                      size="small"
                      icon={<UploadOutlined />}
                      style={{
                        borderRadius: 6,
                        opacity: !isActionAllowed || isRestrictedCOStatus ? 0.5 : 1,
                        padding: "0 8px",
                        fontSize: 11,
                        height: 26,
                      }}
                      disabled={!isActionAllowed || isRestrictedCOStatus}
                    >
                      Upload File
                    </Button>
                  </Upload>
                )}
              </div>
            </div>

            {showNaHint && (
              <div
                style={{
                  fontSize: 12,
                  color: "#8c8c8c",
                  lineHeight: 1.4,
                }}
              >
                Explain this N/A selection in RM General Comment before submit.
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "RM Status",
      width: 156,
      render: (_, record) => {
        const rmStatus = record.rmStatus || "Unknown";
        let displayText = formatStatusForSnakeCase(rmStatus);
        let textColor = gray700;

        if (isNaStatus(rmStatus)) {
          displayText = "N/A";
        }

        const normalizedStatus = String(rmStatus)
          .toLowerCase()
          .replace(/\s+/g, "");

        if (
          normalizedStatus.includes("submittedforreview") ||
          normalizedStatus.includes("submitted_for_review")
        ) {
          textColor = "#52C41A";
        } else if (
          normalizedStatus.includes("deferralrequested") ||
          normalizedStatus.includes("deferral_requested") ||
          normalizedStatus.includes("defferal_requested")
        ) {
          textColor = "#FAAD14";
        } else if (
          normalizedStatus.includes("pendingfromcustomer") ||
          normalizedStatus.includes("pending_from_customer")
        ) {
          textColor = "#FF4D4F";
        } else if (isNaStatus(rmStatus)) {
          textColor = "#595959";
        }

        return (
          <Tooltip title={displayText}>
            <span
              className="doc-table-status-text"
              style={{
                color: textColor,
                fontWeight: 500,
                fontSize: 12,
                whiteSpace: "nowrap",
                display: "inline-block",
                textAlign: "left",
                lineHeight: 1.45,
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
                fontFamily: cardFontFamily,
              }}
            >
              {displayText}
            </span>
          </Tooltip>
        );
      },
    },
  ];



  const viewModalData = viewModalFiles || { files: [], record: null };

  return (
    <div
      className="creator-card creator-completed-docs-card"
      style={{
        marginBottom: 0,
        overflow: "hidden",
        borderColor: "rgba(226, 232, 240, 0.9)",
        fontFamily: cardFontFamily,
        borderRadius: 14,
        boxShadow: "0 10px 26px rgba(26, 54, 54, 0.08)",
      }}
    >
      <div className="creator-card__header">Required Documents</div>
      <div
        className="creator-card__body"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <style>{`
          .creator-completed-docs-card .creator-card__header {
            border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
            padding: 10px 14px !important;
            font-size: 12px !important;
            color: ${gray700} !important;
            font-family: ${cardFontFamily} !important;
          }
          .creator-completed-docs-card .creator-card__body {
            display: flex;
            flex-direction: column;
          }
          .creator-completed-docs-card .ant-table-wrapper .ant-table-thead,
          .creator-completed-docs-card .ant-table-wrapper .ant-table-thead > tr,
          .creator-completed-docs-card .ant-table-wrapper .ant-table-thead > tr > th {
            border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
            box-shadow: none !important;
          }
          .doc-table.ant-table .ant-table-thead > tr > th {
            padding: 9px 12px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--color-text-medium) !important;
            background: var(--color-white) !important;
            border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .doc-table.ant-table .ant-table-tbody > tr > td {
            padding: 8px 12px !important;
            font-size: 12px !important;
            color: var(--color-text-body) !important;
            line-height: 1.45 !important;
            vertical-align: middle !important;
            border-bottom: 1px solid rgba(226, 232, 240, 0.75) !important;
          }
          .doc-table .ant-table-container,
          .doc-table .ant-table-content,
          .doc-table .ant-table-body,
          .doc-table .ant-table-cell {
            background: var(--color-white) !important;
          }
          .doc-table .ant-input,
          .doc-table .ant-input-textarea {
            font-size: 12px !important;
          }
          .doc-table table {
            width: 100% !important;
            table-layout: auto !important;
          }
          .doc-table .ant-select,
          .doc-table .ant-input,
          .doc-table .ant-input-textarea {
            width: 100% !important;
            min-width: 0 !important;
          }
          .doc-table .ant-select .ant-select-selector {
            font-size: 12px !important;
            min-height: 30px !important;
            padding: 0 8px !important;
          }
          .doc-table .ant-btn-sm {
            font-size: 12px !important;
            padding: 0 8px !important;
            height: 28px !important;
          }
          .doc-table .ant-input-affix-wrapper,
          .doc-table .ant-input,
          .doc-table .ant-input-textarea textarea {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }
          .doc-table .ant-btn-sm .anticon {
            font-size: 12px !important;
          }
          .doc-table .ant-btn-dangerous .anticon {
            font-size: 12px !important;
          }
          .doc-table .ant-input-textarea textarea {
            min-height: 30px !important;
            line-height: 1.45 !important;
          }
          .doc-table .ant-table-body {
            overflow-x: auto !important;
            overflow-y: auto !important;
          }
          .doc-table.ant-table .ant-table-tbody > tr:hover > td {
            background: rgba(148, 163, 184, 0.06) !important;
          }
        `}</style>
        <Table
          className="doc-table"
          rowKey="docIdx"
          size="small"
          pagination={false}
          dataSource={docs}
          columns={columns}
          tableLayout="auto"
          scroll={{ x: 1700 }}
        />
        <Modal
          title={<div style={{ fontFamily: cardFontFamily, fontWeight: 600, color: "#1e293b" }}>Associated Files</div>}
          open={!!viewModalFiles}
          onCancel={() => setViewModalFiles(null)}
          footer={[
            <Button key="close" onClick={() => setViewModalFiles(null)} style={{ fontFamily: cardFontFamily }}>
              Close
            </Button>
          ]}
          width={480}
          centered
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontFamily: cardFontFamily }}>
              This document has multiple uploads. Click on any file to view it:
            </p>
            <List
              dataSource={viewModalData.files || []}
              renderItem={(file, idx) => (
                <List.Item
                  style={{
                    padding: "10px 12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, marginRight: 12 }}>
                    <span
                      onClick={() => openFileInNewTab(file.fileUrl)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0f172a",
                        cursor: "pointer",
                        textDecoration: "underline",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontFamily: cardFontFamily,
                      }}
                      title={file.fileName}
                    >
                      {file.fileName || `Attachment ${idx + 1}`}
                    </span>
                    {file.uploadedBy && (
                      <span style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontFamily: cardFontFamily }}>
                        Uploaded by: {file.uploadedBy} ({file.uploadedByRole || "Unknown"})
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Button
                      size="small"
                      onClick={() => openFileInNewTab(file.fileUrl)}
                      style={{ fontFamily: cardFontFamily }}
                    >
                      View
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DocumentTable;
