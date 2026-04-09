import React from "react";
import { Table, Button, Tooltip } from "antd";
import { getFullUrl as getFullUrlUtil } from "../../../utils/checklistUtils.js";
import {
  getCheckerStatusDisplay,
} from "../../../utils/checklistConstants.js";
import { formatStatusText } from "../../../utils/statusColors.js";
import "../../../styles/creatorDesignSystem.css";

const DocumentsTable = ({ docs, checklist }) => {
  const tableFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";

  const getStatusColor = (status) => {
    const lowerStatus = (status || "").toLowerCase();

    if (["submitted", "approved", "sighted", "completed"].includes(lowerStatus)) {
      return "#52C41A";
    }
    if (["pending", "pendingrm", "pendingco", "rejected"].includes(lowerStatus)) {
      return "#FF4D4F";
    }
    if (["deferred", "waived", "tbo"].includes(lowerStatus)) {
      return "#FAAD14";
    }
    return "var(--color-text-medium)";
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 150,
      render: (text) => (
        <span className="completed-doc-table-muted completed-doc-table-muted--wrap">{text || "N/A"}</span>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 180,
      render: (text, record) => {
        const docName =
          text || record.documentName || `Document ${record.docIdx + 1}`;
        return (
          <Tooltip title={docName}>
            <span className="completed-doc-table-primary completed-doc-table-primary--wrap">{docName}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Co Status",
      dataIndex: "status",
      width: 118,
      render: (status, record) => {
        const statusLabel =
          status === "deferred" && record.deferralNo
            ? `Deferred (${record.deferralNo})`
            : formatStatusText(status);

        return (
          <Tooltip title={statusLabel}>
            <span
              className="completed-doc-table-status"
              style={{ color: getStatusColor(status) }}
            >
              {statusLabel}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 180,
      render: (deferralNo) => (
        <Tooltip title={deferralNo || "No deferral number"}>
          {deferralNo ? (
            <span className="completed-doc-table-status completed-doc-table-status--wrap" style={{ color: "#b45309" }}>
              {deferralNo}
            </span>
          ) : "-"}
        </Tooltip>
      ),
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 112,
      render: (finalCheckerStatus) => {
        const checklistStatus = checklist?.status;
        let displayStatus = finalCheckerStatus;

        if (checklistStatus === "approved" || checklistStatus === "completed") {
          displayStatus = "approved";
        } else if (checklistStatus === "rejected") {
          displayStatus = "rejected";
        }

        const statusDisplay = getCheckerStatusDisplay(
          displayStatus,
          checklistStatus,
        );

        return (
          <Tooltip title={statusDisplay.text}>
            <span
              className="completed-doc-table-status"
              style={{ color: getStatusColor(displayStatus) }}
            >
              {statusDisplay.text}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Creator Comment",
      dataIndex: "comment",
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text || "No comment"}>
          <span className="completed-doc-table-muted">{text || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "View",
      key: "view",
      width: 70,
      render: (_, record) =>
        record.fileUrl && (
          <Tooltip title="View document">
            <Button
              size="small"
              onClick={() =>
                window.open(
                  getFullUrlUtil(record.fileUrl || record.uploadData?.fileUrl),
                  "_blank",
                )
              }
              className="completed-modal-view-btn"
            >
              View
            </Button>
          </Tooltip>
        ),
    },
  ];

  return (
    <>
      <style>{`
        .completed-doc-table {
          background: var(--color-white);
          font-family: ${tableFontFamily};
        }
        .completed-doc-table .ant-table,
        .completed-doc-table .ant-table-wrapper,
        .completed-doc-table .ant-table-container,
        .completed-doc-table .ant-table-content,
        .completed-doc-table table,
        .completed-doc-table thead,
        .completed-doc-table tbody,
        .completed-doc-table tr {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        .completed-doc-table .ant-table-thead > tr > th {
          background: transparent !important;
          color: #374151 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-right: none !important;
          text-transform: uppercase;
          font-family: ${tableFontFamily} !important;
        }
        .completed-doc-table .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
          border-top: none !important;
          border-right: none !important;
          padding: 12px 16px !important;
          font-size: 12px !important;
          color: #374151;
          line-height: 1.45;
          font-family: ${tableFontFamily} !important;
        }
        .completed-doc-table .ant-table-thead > tr > th::before,
        .completed-doc-table .ant-table-cell::before,
        .completed-doc-table .ant-table-cell::after,
        .completed-doc-table .ant-table-wrapper::before,
        .completed-doc-table .ant-table-wrapper::after,
        .completed-doc-table .ant-table-container::before,
        .completed-doc-table .ant-table-container::after,
        .completed-doc-table .ant-table-thead > tr::after,
        .completed-doc-table .ant-table-tbody > tr::after {
          display: none !important;
        }
        .completed-doc-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background-color: rgba(214, 189, 152, 0.06) !important;
        }
        .completed-doc-table-primary {
          color: #374151;
          font-size: 12px;
          font-weight: 600;
          font-family: ${tableFontFamily};
        }
        .completed-doc-table-primary--wrap {
          display: block;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.45;
        }
        .completed-doc-table-muted {
          color: #374151;
          font-size: 12px;
          font-weight: 400;
          font-family: ${tableFontFamily};
        }
        .completed-doc-table-muted--wrap {
          display: block;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.45;
        }
        .completed-doc-table-status {
          font-size: 12px;
          font-weight: 600;
          font-family: ${tableFontFamily};
        }
        .completed-doc-table-status--wrap {
          display: inline-block;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.45;
        }
        .completed-modal-view-btn.ant-btn {
          min-height: 32px !important;
          padding: 0 12px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-primary-dark) !important;
          box-shadow: none !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          font-family: ${tableFontFamily} !important;
        }
        .completed-modal-view-btn.ant-btn:hover,
        .completed-modal-view-btn.ant-btn:focus {
          border-color: var(--color-primary-dark) !important;
          background: rgba(214, 189, 152, 0.08) !important;
        }
      `}</style>
      <Table
        className="completed-doc-table"
        columns={columns}
        dataSource={docs}
        pagination={false}
        rowKey="docIdx"
        size="middle"
        tableLayout="auto"
        scroll={{ x: 1180 }}
        locale={{ emptyText: "No documents" }}
      />
    </>
  );
};

export default DocumentsTable;
