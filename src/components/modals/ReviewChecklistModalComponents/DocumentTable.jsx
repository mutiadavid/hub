import React from "react";
import dayjs from "dayjs";
import {
  Table,
  Input,
  Select,
  Button,
  Popconfirm,
  DatePicker,
  Tooltip,
  Popover,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { getExpiryMeta, getExpiryStatus } from "../../../utils/documentUtils";
import { getFullUrl } from "../../../utils/checklistUtils";
import { formatStatusForSnakeCase } from "../../../utils/statusColors";
import "../../../styles/creatorDesignSystem.css";

const { Option } = Select;

const normalizeStatusValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const isDeferredStatusValue = (value) =>
  ["deferred", "deferralrequested", "defferalrequested"].includes(
    normalizeStatusValue(value),
  );

const getResolvedCheckerStatus = (record) =>
  record?.finalCheckerStatus ||
  record?.checkerStatus ||
  record?.coCheckerStatus ||
  record?.co_checker_status ||
  "";

const getDisplayText = (value, fallback = "N/A") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const DocumentTable = ({
  docs,
  onNameChange,
  onActionChange,
  onCommentChange,
  onDeferralNoChange,
  onClearDeferralValidation,
  onDelete,
  onExpiryDateChange,
  onViewFile, // ✅ Make sure this is passed
  isActionDisabled,
  checklistStatus, // ✅ Accept checklist status as prop
  deferralValidationByDoc = {},
  onValidateDeferralNo,
}) => {
  const safeDocs = Array.isArray(docs) ? docs : [];
  const pageSize = 6;
  const verticalScrollHeight = 360;
  const [openDeferralPopoverDoc, setOpenDeferralPopoverDoc] = React.useState(null);
  const [transientValidationByDoc, setTransientValidationByDoc] = React.useState({});
  const transientValidationTimersRef = React.useRef({});
  const previousValidationRef = React.useRef({});

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
        approvedAtText: validationState.approvedAtText,
      });
      const previousSignature = previousValidation
        ? JSON.stringify({
            status: previousValidation.status,
            message: previousValidation.message,
            approvedAtText: previousValidation.approvedAtText,
          })
        : null;

      if (
        nextSignature !== previousSignature &&
        !["idle", "validating"].includes(validationState.status) &&
        (validationState.message || validationState.approvedAtText)
      ) {
        setTransientValidationByDoc((prev) => ({
          ...prev,
          [docKey]: {
            status: validationState.status,
            message: validationState.message,
            approvedAtText: validationState.approvedAtText,
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

  // CoCreator can act when:
  // 1. Checklist status is "pending" or "cocreatorreview" OR
  // 2. Document status is "pendingco"
  const canActOnDoc = (doc) => {
    if (isActionDisabled) return false;

    const docStatus = (doc.status || "").toLowerCase();
    const checklistStat = (checklistStatus || "").toLowerCase();

    // Allow actions when checklist is in pending/cocreatorreview OR document is pendingco
    return (
      ["pending", "cocreatorreview"].includes(checklistStat) ||
      docStatus === "pendingco"
    );
  };
  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 150,
      render: (text) => (
        <Tooltip title={getDisplayText(text)}>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-body)",
              fontWeight: 500,
              lineHeight: 1.45,
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {getDisplayText(text)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 185,
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 2 }}
          value={record.name || ""}
          onChange={(e) => onNameChange?.(record.docIdx, e.target.value)}
          disabled={isActionDisabled || typeof onNameChange !== "function"}
          className="creator-input"
          style={{ fontSize: 12, resize: "none", minWidth: 200 }}
        />
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 145,
      render: (text, record) => {
        const validationState = deferralValidationByDoc?.[record.docIdx];
        const isDeferredRow = isDeferredStatusValue(
          record.action || record.status,
        );
        const transientValidation = transientValidationByDoc?.[record.docIdx];
        const actionDisplayText = formatStatusForSnakeCase(
          record.action || record.status || "pending",
        );

        const deferralPopoverContent = (
          <div style={{ width: 190, display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-text-body)",
              }}
            >
              Deferral Number
            </div>
            <Input
              size="small"
              placeholder="Enter deferral no"
              value={record.deferralNo || record.deferralNumber || ""}
              onChange={(e) =>
                onDeferralNoChange?.(record.docIdx, e.target.value)
              }
              onBlur={() =>
                onValidateDeferralNo?.(
                  record.docIdx,
                  record.deferralNo || record.deferralNumber || "",
                )
              }
              status={validationState?.status === "invalid" ? "error" : ""}
              style={{ fontSize: 12 }}
              disabled={!canActOnDoc(record)}
              autoFocus
            />

            {transientValidation ? (
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
                {transientValidation.approvedAtText ? (
                  <div>Final approval date: {transientValidation.approvedAtText}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        );

        return (
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Tooltip title={actionDisplayText}>
              <Popover
                content={deferralPopoverContent}
                trigger="click"
                placement="bottomLeft"
                open={openDeferralPopoverDoc === record.docIdx && isDeferredRow}
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
                  value={record.action}
                  title={actionDisplayText}
                  style={{ width: "100%", minWidth: 140, fontSize: 12 }}
                  onChange={(val) => {
                    onActionChange(record.docIdx, val);

                    if (!isDeferredStatusValue(val)) {
                      onClearDeferralValidation?.(record.docIdx);
                      setOpenDeferralPopoverDoc((currentDocIdx) =>
                        currentDocIdx === record.docIdx ? null : currentDocIdx,
                      );
                    } else {
                      setOpenDeferralPopoverDoc(record.docIdx);
                      if (record.deferralNo || record.deferralNumber) {
                        onDeferralNoChange?.(
                          record.docIdx,
                          record.deferralNo || record.deferralNumber || "",
                        );
                      }
                    }
                  }}
                  disabled={!canActOnDoc(record)}
                >
                  <Option value="submitted">Submitted</Option>
                  <Option value="pendingrm">Pending RM</Option>
                  <Option value="pendingco">Pending Co</Option>
                  <Option value="tbo">TBO</Option>
                  <Option value="sighted">Sighted</Option>
                  <Option value="waived">Waived</Option>
                  <Option value="deferred">Deferred</Option>
                </Select>
              </Popover>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Creator Status",
      dataIndex: "status",
      width: 156,
      render: (status, record) => {
        const statusLabel =
          status === "deferred" && record.deferralNo ? "Deferred" : status;

        // Define colors for each status with better visibility
        let textColor = "#000";

        const normalizedStatus = String(status || "")
          .toLowerCase()
          .replace(/\s+/g, "");

        if (
          normalizedStatus.includes("submitted") ||
          normalizedStatus.includes("sighted")
        ) {
          textColor = "#52C41A"; // Green
        } else if (
          normalizedStatus.includes("deferred") ||
          normalizedStatus.includes("waived") ||
          normalizedStatus.includes("tbo")
        ) {
          textColor = "#FAAD14"; // Amber
        } else if (normalizedStatus.includes("pending")) {
          textColor = "#FF4D4F"; // Red
        } else if (normalizedStatus.includes("approved")) {
          textColor = "#52C41A"; // Green
        } else if (normalizedStatus.includes("rejected")) {
          textColor = "#FF4D4F"; // Red
        }

        return (
          <Tooltip title={statusLabel}>
            <span
              className="doc-table-status-text"
              style={{
                color: textColor,
                fontWeight: "600",
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {formatStatusForSnakeCase(statusLabel || "pending")}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 150,
      render: (deferralNo, record) => {
        const deferralNum = record.deferralNo || record.deferralNumber;

        return (
          <div style={{ minWidth: 0 }}>
            {deferralNum ? (
              <Tooltip title={deferralNum}>
                <span
                  className="doc-table-status-text"
                  style={{
                    color: "#b45309",
                    fontWeight: 600,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    wordBreak: "normal",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "inline-block",
                    maxWidth: "100%",
                  }}
                >
                  {deferralNum}
                </span>
              </Tooltip>
            ) : (
              <span>-</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 156,
      render: (_, record) => {
        const checkerStatus = getResolvedCheckerStatus(record);
        // Define colors for each status with better visibility
        // approved/sighted: white background, green text
        // waived/tbo/deferred: white background, amber text
        // rejected: white background, red text
        // pending: red background, red text
        let textColor = "#000";
        let label = checkerStatus || "Pending";

        const normalizedStatus = String(checkerStatus || "")
          .toLowerCase()
          .replace(/\s+/g, "");

        if (
          normalizedStatus.includes("approved") ||
          normalizedStatus.includes("sighted")
        ) {
          textColor = "#52C41A"; // Green
          label = normalizedStatus.includes("approved")
            ? "approved"
            : "sighted";
        } else if (
          normalizedStatus.includes("waived") ||
          normalizedStatus.includes("tbo") ||
          normalizedStatus.includes("deferred")
        ) {
          textColor = "#FAAD14"; // Amber
          const statusType = normalizedStatus.includes("waived")
            ? "waived"
            : normalizedStatus.includes("tbo")
              ? "tbo"
              : "deferred";
          label = statusType;
        } else if (normalizedStatus.includes("rejected")) {
          textColor = "#FF4D4F"; // Red
          label = "rejected";
        } else {
          textColor = "#FF4D4F"; // Red text
          label = "pending";
        }

        const displayText = label;

        return (
          <Tooltip title={displayText}>
            <span
              className="doc-table-status-text"
              style={{
                color: textColor,
                fontWeight: "600",
                textTransform: "capitalize",
                fontSize: 12,
              }}
            >
              {formatStatusForSnakeCase(displayText)}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Creator Comment",
      dataIndex: "comment",
      width: 165,
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 2 }}
          value={text}
          onChange={(e) => onCommentChange(record.docIdx, e.target.value)}
          disabled={!canActOnDoc(record)}
          style={{ fontSize: 12, resize: "none", minWidth: 170 }}
        />
      ),
    },
    {
      title: "Expiry",
      dataIndex: "expiryDate",
      width: 138,
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();

        if (category !== "compliance documents") {
          return "-";
        }

        const dateValue = record.expiryDate ? dayjs(record.expiryDate) : null;
        const expiryStatus = getExpiryStatus(record.expiryDate);
        const expiryMeta = getExpiryMeta(record.expiryDate);
        const canEditExpiry = canActOnDoc(record);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 104 }}>
            {canEditExpiry ? (
              <DatePicker
                value={dateValue}
                onChange={(date) => onExpiryDateChange(record.docIdx, date)}
                allowClear
                disabled={!canEditExpiry}
                style={{ width: "100%", fontSize: 13 }}
                placeholder="Select expiry"
                size="middle"
              />
            ) : (
              !expiryMeta ? (
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  No expiry set
                </span>
              ) : null
            )}
            {expiryStatus && expiryMeta ? (
              <>
                <span
                  style={{
                    alignSelf: "flex-start",
                    color: expiryStatus === "expired" ? "#cf1322" : "#237804",
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  {expiryMeta.label}
                </span>
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
              </>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "RM Status",
      dataIndex: "rmStatus",
      width: 150,
      render: (status) => {
        if (!status) {
          return <span style={{ color: "var(--color-text-light)" }}>-</span>;
        }

        // Define colors for each status
        // submitted_for_review: white background, green text
        // deferral_requested: white background, amber text
        // pending_from_customer: red theme
        let textColor = "#000";

        const normalizedStatus = String(status)
          .toLowerCase()
          .replace(/\s+/g, "");

        if (
          normalizedStatus.includes("submittedforreview") ||
          normalizedStatus.includes("submitted_for_review")
        ) {
          textColor = "#52C41A"; // Green
        } else if (
          normalizedStatus.includes("deferralrequested") ||
          normalizedStatus.includes("deferral_requested") ||
          normalizedStatus.includes("defferal_requested")
        ) {
          textColor = "#FAAD14"; // Amber
        } else if (
          normalizedStatus.includes("pendingfromcustomer") ||
          normalizedStatus.includes("pending_from_customer")
        ) {
          textColor = "#FF4D4F"; // Red
        }

        const displayText = formatStatusForSnakeCase(status);
        // Remove deferral number from display - shown in Deferral No column

        return (
          <Tooltip title={displayText}>
            <span
              className="doc-table-status-text"
              style={{
                color: textColor,
                fontWeight: 500,
                fontSize: 12,
                whiteSpace: "nowrap",
                wordBreak: "normal",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                maxWidth: "100%",
              }}
            >
              {displayText}
            </span>
          </Tooltip>
        );
      },
    },
    // DocumentTable.jsx - In the "View" column render function
    {
      title: "View",
      key: "view",
      width: 104,
      className: "doc-table-view-cell",
      render: (_, record) =>
        record.fileUrl || record.uploadData?.fileUrl ? (
          <Button
            onClick={() => {
              // ✅ Add null check
              if (typeof onViewFile === "function") {
                onViewFile(record);
              } else {
                console.error("onViewFile is not a function");
                // Fallback: open URL directly with inline parameter
                const fileUrl = record.fileUrl || record.uploadData?.fileUrl;
                if (fileUrl) {
                  const fullUrl = getFullUrl(fileUrl);
                  const viewUrl = fullUrl.includes("?")
                    ? `${fullUrl}&inline=true`
                    : `${fullUrl}?inline=true`;
                  window.open(viewUrl, "_blank", "noopener,noreferrer");
                }
              }
            }}
            size="small"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#d9d9d9",
              color: "#333",
              borderRadius: 6,
              fontSize: 12,
              height: 28,
              padding: "0 12px",
            }}
          >
            View
          </Button>
        ) : (
          <span style={{ color: "var(--color-text-light)", fontSize: 12 }}>No file</span>
        ),
    },
    {
      title: "Del",
      key: "delete",
      width: 72,
      className: "doc-table-delete-cell",
      render: (_, record) => (
        <Popconfirm
          title="Delete document?"
          description="This action cannot be undone."
          okText="Yes"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(record.docIdx)}
          disabled={!canActOnDoc(record)}
        >
          <Button
            type="text"
            danger
            size="small"
            disabled={!canActOnDoc(record)}
            style={{ fontSize: 12, padding: 0, width: 28, height: 28 }}
          >
            <DeleteOutlined />
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div
      className="creator-card creator-completed-docs-card"
      style={{
        marginBottom: 0,
        overflow: "hidden",
        borderColor: "rgba(226, 232, 240, 0.9)",
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
          font-size: 10px !important;
          font-weight: 600 !important;
          color: var(--color-text-medium) !important;
          background: var(--color-white) !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
          text-transform: uppercase;
          white-space: normal !important;
          line-height: 1.25 !important;
          letter-spacing: 0.02em !important;
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
          table-layout: fixed !important;
        }
        .doc-table .ant-select,
        .doc-table .ant-picker,
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
        .doc-table .ant-select-selection-item {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          line-height: 28px !important;
        }
        .doc-table .ant-table-tbody .ant-table-cell {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .doc-table .ant-table-cell .ant-tooltip-open-trigger,
        .doc-table .doc-table-status-text {
          max-width: 100%;
        }
        .doc-table .doc-table-view-cell,
        .doc-table .doc-table-delete-cell {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }
        .doc-table .doc-table-view-cell {
          padding-left: 18px !important;
        }
        .doc-table .doc-table-delete-cell {
          padding-left: 16px !important;
        }
        .doc-table .doc-table-view-cell .ant-btn,
        .doc-table .doc-table-delete-cell .ant-btn {
          margin-right: 6px;
        }
        .doc-table .ant-btn-sm {
          font-size: 12px !important;
          padding: 0 8px !important;
          height: 28px !important;
        }
        .doc-table .ant-picker {
          min-height: 30px !important;
          padding: 0 8px !important;
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
        .doc-table .ant-pagination {
          margin: 12px 16px 14px !important;
          justify-content: flex-end;
        }
        .doc-table .ant-input-textarea textarea {
          min-height: 30px !important;
          line-height: 1.45 !important;
        }
        .doc-table .ant-input-textarea,
        .doc-table .ant-input-textarea textarea {
          overflow-wrap: break-word !important;
          word-break: break-word !important;
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
        columns={columns}
        dataSource={safeDocs}
        pagination={{
          pageSize,
          hideOnSinglePage: false,
          size: "small",
          position: ["bottomRight"],
          showSizeChanger: false,
        }}
        rowKey="docIdx"
        size="small"
        tableLayout="fixed"
        scroll={safeDocs.length > 5 ? { x: 1700, y: verticalScrollHeight } : { x: 1700 }}
        locale={{
          emptyText: "No documents available",
        }}
      />
      </div>
    </div>
  );
};

export default DocumentTable;
  