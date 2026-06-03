import React, { useState } from "react";
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
  Tabs,
  Badge,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { openFileInNewTab } from "../../../utils/fileUtils";
import useProtectedFileFetcher from "../../../hooks/useProtectedFileFetcher";
import { getExpiryMeta, getExpiryStatus } from "../../../utils/documentStats";
import { formatStatusForSnakeCase } from "../../../utils/statusColors";
import { API_ORIGIN } from "../../../config/runtimeConfig";
import "../../../styles/creatorDesignSystem.css";

const { TabPane } = Tabs;
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

// Helper function to group documents by category
const groupDocumentsByCategory = (docsData) => {
  const grouped = {};
  docsData.forEach((doc, idx) => {
    const category = doc.category || "Uncategorized";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({ ...doc, docIdx: idx });
  });
  return grouped;
};

// Helper function to get category badge color
const getCategoryColor = (category) => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("compliance")) return "#10b981";
  if (categoryLower.includes("financial")) return "#3b82f6";
  if (categoryLower.includes("legal")) return "#8b5cf6";
  if (categoryLower.includes("kra")) return "#f59e0b";
  if (categoryLower.includes("identification")) return "#ec4899";
  return "#64748b";
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
  isReturned,
}) => {
  const { openFile } = useProtectedFileFetcher();
  const [openDeferralPopoverDoc, setOpenDeferralPopoverDoc] = useState(null);
  const [transientValidationByDoc, setTransientValidationByDoc] = useState({});
  const [viewModalFiles, setViewModalFiles] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const transientValidationTimersRef = React.useRef({});
  const previousValidationRef = React.useRef({});

  const safeDocs = Array.isArray(docs) ? docs : [];
  const groupedDocs = groupDocumentsByCategory(safeDocs);
  const categories = Object.keys(groupedDocs);

  // Set initial active category
  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

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

  const handleDeleteFile = (docIdx, fileIdx = null) => {
    if (typeof onEdit === "function") {
      onEdit();
    }
    setDocs((prev) =>
      prev.map((d, idx) => {
        if (idx === docIdx) {
          if (fileIdx !== null && Array.isArray(d.uploads) && d.uploads.length > 0) {
            const newUploads = [...d.uploads];
            newUploads.splice(fileIdx, 1);
            return {
              ...d,
              uploads: newUploads,
              uploadData: newUploads.length > 0 ? newUploads[newUploads.length - 1] : null,
              fileUrl: newUploads.length > 0 ? newUploads[newUploads.length - 1].fileUrl : null,
              rmTouched: true,
            };
          }
          return {
            ...d,
            uploads: [],
            uploadData: null,
            fileUrl: null,
            rmTouched: true,
          };
        }
        return d;
      })
    );
  };

  const getColumns = () => [
    {
      title: "Document Name",
      dataIndex: "name",
      width: 240,
      render: (text) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text || "N/A"}
          disabled
          style={{ fontSize: 12, resize: "none", color: gray700, opacity: 0.72, fontFamily: cardFontFamily }}
        />
      ),
    },
    {
      title: "Creator Status",
      width: 130,
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
          style={{ fontSize: 12, resize: "none", color: gray700, opacity: 0.72, fontFamily: cardFontFamily }}
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
                  fontFamily: cardFontFamily,
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
                fontFamily: cardFontFamily,
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
      width: 280,
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
              style={{ fontSize: 12, fontFamily: cardFontFamily }}
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
                  fontFamily: cardFontFamily,
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
                    return <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: cardFontFamily }}>No files uploaded</span>;
                  }

                  if (files.length === 1) {
                    const canDelete = !isReturned || files[0].isNewUpload === true;
                    return (
                      <>
                        {!readOnly && isActionAllowed && !isRestrictedCOStatus && canDelete && (
                          <Popconfirm
                            title="Delete this file?"
                            onConfirm={() => handleDeleteFile(record.docIdx)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              style={{
                                borderRadius: 6,
                                padding: "0 8px",
                                height: 26,
                                fontFamily: cardFontFamily,
                              }}
                            />
                          </Popconfirm>
                        )}
                        <Button
                          size="small"
                          onClick={() => openFile(files[0].fileUrl).catch((err) => console.error(err))}
                          style={{
                            backgroundColor: "#ffffff",
                            borderColor: "#d9d9d9",
                            color: "#333",
                            borderRadius: 6,
                            padding: "0 8px",
                            fontSize: 11,
                            height: 26,
                            fontFamily: cardFontFamily,
                          }}
                        >
                          View
                        </Button>
                      </>
                    );
                  }

                  return (
                    <>
                      {!readOnly && isActionAllowed && !isRestrictedCOStatus && files.every(f => !isReturned || f.isNewUpload === true) && (
                        <Popconfirm
                          title="Delete all files?"
                          onConfirm={() => handleDeleteFile(record.docIdx)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{
                              borderRadius: 6,
                              padding: "0 8px",
                              height: 26,
                              fontFamily: cardFontFamily,
                            }}
                          />
                        </Popconfirm>
                      )}
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
                          fontFamily: cardFontFamily,
                        }}
                      >
                        View ({files.length} Files)
                      </Button>
                    </>
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
                        fontFamily: cardFontFamily,
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
                  fontFamily: cardFontFamily,
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

  const columns = getColumns();
  const viewModalData = viewModalFiles || { files: [], record: null };

  // Render table for a specific category (used for single category)
  const renderCategoryTable = (category) => {
    const categoryDocs = groupedDocs[category] || [];
    const categoryColor = getCategoryColor(category);

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `2px solid ${categoryColor}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: categoryColor,
                fontFamily: cardFontFamily,
              }}
            >
              {category}
            </span>
            <Badge
              count={categoryDocs.length}
              style={{
                backgroundColor: categoryColor,
                color: "#fff",
              }}
            />
          </div>
        </div>

        <Table
          className="doc-table"
          rowKey="docIdx"
          size="small"
          pagination={false}
          dataSource={categoryDocs}
          columns={columns}
          tableLayout="auto"
          scroll={{ x: 1700 }}
        />
      </div>
    );
  };

  // If no documents, show empty state
  if (safeDocs.length === 0) {
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
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: "#999", marginBottom: "8px", fontFamily: cardFontFamily }}>
            No documents found
          </p>
          <p style={{ fontSize: "12px", color: "#666", fontFamily: cardFontFamily }}>
            Documents will appear here once added
          </p>
        </div>
      </div>
    );
  }

  // If only one category or less, show single table without tabs
  if (categories.length <= 1) {
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

          {categories.map((category) => renderCategoryTable(category))}

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
                        onClick={() => openFile(file.fileUrl).catch((err) => console.error(err))}
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
                      {!readOnly && isActionAllowed && viewModalData?.record && !["submitted", "tbo", "waived", "sighted", "deferred", "pendingco"].includes((viewModalData.record.status || "").toLowerCase()) && (!isReturned || file.isNewUpload === true) && (
                        <Popconfirm
                          title="Delete this file?"
                          onConfirm={() => {
                            handleDeleteFile(viewModalData.record.docIdx, idx);
                            setViewModalFiles(prev => {
                              if (!prev) return prev;
                              const newFiles = [...prev.files];
                              newFiles.splice(idx, 1);
                              if (newFiles.length === 0) return null;
                              return { ...prev, files: newFiles };
                            });
                          }}
                          okText="Yes"
                          cancelText="No"
                          placement="left"
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ fontFamily: cardFontFamily }}
                          />
                        </Popconfirm>
                      )}
                      <Button
                        size="small"
                        onClick={() => openFile(file.fileUrl).catch((err) => console.error(err))}
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
  }

  // Multiple categories - use tabs
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
          .doc-category-tab .ant-tabs-tab {
            padding: 8px 16px !important;
            margin: 0 !important;
          }
          .doc-category-tab .ant-tabs-nav {
            margin-bottom: 16px !important;
          }
          .doc-category-tab .ant-tabs-nav::before {
            border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
          }
          .doc-category-tab .ant-tabs-tab-active .ant-tabs-tab-btn {
            font-weight: 600 !important;
          }
          .doc-category-tab .ant-tabs-ink-bar {
            background: #164679 !important;
            height: 2px !important;
          }
        `}</style>

        <Tabs
          className="doc-category-tab"
          activeKey={activeCategory}
          onChange={setActiveCategory}
          type="line"
          style={{ padding: "0 16px", marginTop: 8 }}
        >
          {categories.map((category) => {
            const categoryColor = getCategoryColor(category);
            const categoryCount = groupedDocs[category]?.length || 0;

            return (
              <TabPane
                key={category}
                tab={
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: categoryColor, fontFamily: cardFontFamily }}>{category}</span>
                    <Badge
                      count={categoryCount}
                      style={{
                        backgroundColor: categoryColor,
                        color: "#fff",
                        fontSize: 10,
                        minWidth: 18,
                        height: 18,
                        lineHeight: "18px",
                      }}
                    />
                  </span>
                }
              >
                <div style={{ padding: "0 0 16px 0" }}>
                  <Table
                    className="doc-table"
                    rowKey="docIdx"
                    size="small"
                    pagination={false}
                    dataSource={groupedDocs[category]}
                    columns={columns}
                    tableLayout="auto"
                    scroll={{ x: 1700 }}
                  />
                </div>
              </TabPane>
            );
          })}
        </Tabs>

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
                      onClick={() => openFile(file.fileUrl).catch((err) => console.error(err))}
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
                    {!readOnly && isActionAllowed && viewModalData?.record && !["submitted", "tbo", "waived", "sighted", "deferred", "pendingco"].includes((viewModalData.record.status || "").toLowerCase()) && (!isReturned || file.isNewUpload === true) && (
                      <Popconfirm
                        title="Delete this file?"
                        onConfirm={() => {
                          handleDeleteFile(viewModalData.record.docIdx, idx);
                          setViewModalFiles(prev => {
                            if (!prev) return prev;
                            const newFiles = [...prev.files];
                            newFiles.splice(idx, 1);
                            if (newFiles.length === 0) return null;
                            return { ...prev, files: newFiles };
                          });
                        }}
                        okText="Yes"
                        cancelText="No"
                        placement="left"
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          style={{ fontFamily: cardFontFamily }}
                        />
                      </Popconfirm>
                    )}
                    <Button
                      size="small"
                      onClick={() => openFile(file.fileUrl).catch((err) => console.error(err))}
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