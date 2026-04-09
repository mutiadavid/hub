import React, { useMemo, useState } from "react";
import { Button, Descriptions, Empty, Spin, Table, Typography } from "antd";
import { useSelector } from "react-redux";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../../../service/deferralApi";
import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getDeferralDocumentBuckets,
  resolveDocumentDaysAndDateWithExtension,
} from "../../../../utils/deferralDocuments";
import { getLivePartyApprovalStatuses } from "../../../../utils/deferralApprovalStatus";
import { buildExtensionHistoryEntries, resolveDisplayName } from "../../../../utils/extensionHistory";
import { downloadFile, openFileInNewTab } from "../../../../utils/fileUtils";
import { PRIMARY_BLUE, SUCCESS_GREEN } from "../utils/constants";
import CommentTrail from "./CommentTrail";

const TABS = [
  { key: "details", label: "Extension Details" },
  { key: "documents", label: "Documents & Flow" },
];

const EXTENSION_REVIEW_STYLES = `
  .actioned-extension-review {
    padding: 16px;
    background: rgba(245, 247, 244, 0.85);
    border-top: 1px solid rgba(214, 189, 152, 0.2);
  }
  .actioned-extension-review__tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    margin-bottom: 16px;
    overflow-x: auto;
  }
  .actioned-extension-review__tab {
    padding: 10px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-light);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
  }
  .actioned-extension-review__tab--active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary-dark);
  }
  .actioned-extension-review__layout {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
    gap: 16px;
    align-items: start;
  }
  .actioned-extension-review__main {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .actioned-extension-review__section,
  .actioned-extension-review__comments,
  .actioned-extension-review__table-shell {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    overflow: hidden;
  }
  .actioned-extension-review__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }
  .actioned-extension-review__section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-dark);
  }
  .actioned-extension-review__section-body {
    padding: 16px;
  }
  .actioned-extension-review__comments {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .actioned-extension-review .ant-descriptions-item-label {
    font-weight: 700 !important;
    color: var(--color-text-light) !important;
    font-size: 11px !important;
    text-transform: uppercase;
  }
  .actioned-extension-review .ant-descriptions-item-content {
    color: var(--color-text-dark) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
  }
  .actioned-extension-review .ant-table,
  .actioned-extension-review .ant-table-wrapper,
  .actioned-extension-review .ant-spin-nested-loading,
  .actioned-extension-review .ant-spin-container,
  .actioned-extension-review .ant-table-container,
  .actioned-extension-review .ant-table-content,
  .actioned-extension-review table,
  .actioned-extension-review thead,
  .actioned-extension-review tbody,
  .actioned-extension-review tr {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  .actioned-extension-review .ant-table-thead > tr > th {
    background: transparent !important;
    color: var(--color-text-medium) !important;
    font-size: 11px;
    font-weight: 600;
    padding: 12px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    text-transform: uppercase;
    border-right: none !important;
  }
  .actioned-extension-review .ant-table-tbody > tr > td {
    padding: 14px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
    border-right: none !important;
    color: var(--color-text-medium);
    font-size: 12px;
  }
  .actioned-extension-review .ant-table-thead > tr > th::before,
  .actioned-extension-review .ant-table-cell::before,
  .actioned-extension-review .ant-table-cell::after {
    display: none !important;
  }
  .actioned-extension-review__empty {
    padding: 24px;
  }
  @media (max-width: 1023px) {
    .actioned-extension-review__layout {
      grid-template-columns: 1fr;
    }
  }
`;

const ExtensionApplicationsTab = ({
  extensions = [],
  loading = false,
  tableClassName = "actioned-table",
}) => {
  const token = useSelector((state) => state.auth.token);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [tabState, setTabState] = useState({});
  const [hydratedExtensions, setHydratedExtensions] = useState({});
  const [loadingDetailsByKey, setLoadingDetailsByKey] = useState({});

  const toggleExpanded = async (record) => {
    const key = record._id || record.id;
    const isExpanded = expandedRowKeys.includes(key);

    if (isExpanded) {
      setExpandedRowKeys((prev) => prev.filter((item) => item !== key));
      return;
    }

    setExpandedRowKeys([key]);

    if (hydratedExtensions[key] || loadingDetailsByKey[key]) {
      return;
    }

    setLoadingDetailsByKey((prev) => ({ ...prev, [key]: true }));

    try {
      const extensionId = record?._id || record?.id;
      const fullExtension = extensionId
        ? await deferralApi.getExtensionById(extensionId, token)
        : record;
      const deferralId =
        fullExtension?.deferralId ||
        fullExtension?.deferral?._id ||
        fullExtension?.deferral?.id ||
        record?.deferralId ||
        record?.deferral?._id ||
        record?.deferral?.id;
      const fullDeferral = deferralId
        ? await deferralApi.getDeferralById(deferralId, token)
        : fullExtension?.deferral || record?.deferral || record?.linkedDeferral || null;

      setHydratedExtensions((prev) => ({
        ...prev,
        [key]: {
          ...record,
          ...fullExtension,
          deferral: fullDeferral || fullExtension?.deferral || record?.deferral || null,
          linkedDeferral:
            fullDeferral ||
            fullExtension?.linkedDeferral ||
            fullExtension?.deferral ||
            record?.linkedDeferral ||
            record?.deferral ||
            null,
        },
      }));
    } catch (error) {
      console.error("Failed to hydrate actioned extension details:", error);
    } finally {
      setLoadingDetailsByKey((prev) => ({ ...prev, [key]: false }));
    }
  };

  const setActiveTab = (key, tab) => {
    setTabState((prev) => ({ ...prev, [key]: tab }));
  };

  const columns = [
    {
      title: "Deferral No",
      dataIndex: ["deferral", "deferralNumber"],
      key: "deferralNumber",
      width: 120,
      render: (text, record) => (
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {text || record.deferralNumber || record.deferralId || "N/A"}
        </span>
      ),
    },
    {
      title: "Customer",
      dataIndex: ["deferral", "customerName"],
      key: "customerName",
      width: 200,
      render: (text, record) => (
        <span style={{ color: "var(--color-text-medium)", fontWeight: 600 }}>
          {text || record.customerName || "Unknown Customer"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(214, 189, 152, 0.18)",
            color: "var(--color-primary-dark)",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {(status || "pending").replace(/_/g, " ")}
        </span>
      ),
    },
    {
      title: "Requested At",
      dataIndex: "requestedAt",
      key: "requestedAt",
      width: 160,
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A",
    },
    {
      title: "Review",
      key: "review",
      width: 120,
      render: (_, record) => {
        const rowKey = record._id || record.id;
        const expanded = expandedRowKeys.includes(rowKey);
        return (
          <Button
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded(record);
            }}
          >
            {expanded ? "Hide" : "Review"}
          </Button>
        );
      },
    },
  ];

  const uploadedDocumentColumns = useMemo(
    () => [
      {
        title: "Document",
        dataIndex: "name",
        key: "name",
        render: (value, record) => (
          <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
            {value || record.originalName || "Document"}
          </span>
        ),
      },
      {
        title: "Uploaded At",
        dataIndex: "uploadDate",
        key: "uploadDate",
        width: 140,
        render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 160,
        render: (_, record) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openFileInNewTab(record.fileUrl || record.url)}
              disabled={!record.fileUrl && !record.url}
            >
              View
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                downloadFile(record.fileUrl || record.url, record.name || record.originalName || "document")
              }
              disabled={!record.fileUrl && !record.url}
            >
              Download
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const requestedDocumentColumns = useMemo(
    () => [
      {
        title: "Document",
        dataIndex: "name",
        key: "name",
        render: (value) => (
          <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
            {value || "Untitled document"}
          </span>
        ),
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        render: (value, record) => value || record.documentType || "-",
      },
      {
        title: "Days Sought",
        dataIndex: "requestedDays",
        key: "requestedDays",
        width: 120,
        render: (value, record) => value || record.daysSought || "-",
      },
      {
        title: "New Due Date",
        dataIndex: "newDueDate",
        key: "newDueDate",
        width: 140,
        render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
      },
    ],
    [],
  );

  const approvalColumns = useMemo(
    () => [
      {
        title: "Approver",
        key: "approver",
        render: (_, record, index) => (
          <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
            {resolveDisplayName(
              record?.user?.name,
              record?.user?.fullName,
              record?.userName,
              record?.name,
              record?.approverName,
              record?.email,
              `Approver ${index + 1}`,
            )}
          </span>
        ),
      },
      {
        title: "Role",
        key: "role",
        render: (_, record) => record.designation || record.role || "-",
      },
      {
        title: "Status",
        key: "status",
        width: 140,
        render: (_, record) => {
          const approved =
            record.approved === true ||
            String(record.approvalStatus || record.status || "").toLowerCase() === "approved";
          return (
            <span style={{ fontWeight: 700, color: approved ? SUCCESS_GREEN : PRIMARY_BLUE }}>
              {approved ? "Approved" : "Pending Approval"}
            </span>
          );
        },
      },
    ],
    [],
  );

  const renderExpandedRow = (record) => {
    const rowKey = record._id || record.id;
    const detailRecord = hydratedExtensions[rowKey] || record;
    const activeTab = tabState[rowKey] || "details";
    const linkedDeferral = detailRecord?.deferral || detailRecord?.linkedDeferral || {};
    const livePartyStatuses = getLivePartyApprovalStatuses(detailRecord);
    const { requestedDocs = [] } = getDeferralDocumentBuckets(detailRecord);
    const { dclDocs = [], uploadedDocs = [] } = getDeferralDocumentBuckets(linkedDeferral);
    const documentsToBeDeferred = requestedDocs.map((doc) => {
      const { days, nextDate } = resolveDocumentDaysAndDateWithExtension(doc, linkedDeferral, detailRecord);
      return {
        ...doc,
        requestedDays: days,
        newDueDate: nextDate,
      };
    });
    const facilities = Array.isArray(linkedDeferral?.facilities)
      ? linkedDeferral.facilities
      : Array.isArray(linkedDeferral?.Facilities)
        ? linkedDeferral.Facilities
        : [];
    const extensionAdditionalFiles = Array.isArray(detailRecord?.additionalFiles)
      ? detailRecord.additionalFiles
      : Array.isArray(detailRecord?.AdditionalFiles)
        ? detailRecord.AdditionalFiles
        : [];
    const additionalDocuments = [...uploadedDocs, ...extensionAdditionalFiles];
    const extensionHistory = buildExtensionHistoryEntries(detailRecord);
    const approvalFlow = detailRecord.approvers || detailRecord.Approvers || [];
    const detailsLoading = loadingDetailsByKey[rowKey] === true;

    return (
      <div className="actioned-extension-review">
        <style>{EXTENSION_REVIEW_STYLES}</style>
        {detailsLoading ? (
          <div className="creator-tab-loading" style={{ padding: 24 }}>
            <Spin />
          </div>
        ) : null}

        <div className="actioned-extension-review__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`actioned-extension-review__tab ${activeTab === tab.key ? "actioned-extension-review__tab--active" : ""}`}
              onClick={() => setActiveTab(rowKey, tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <div className="actioned-extension-review__layout">
            <div className="actioned-extension-review__main">
              <section className="actioned-extension-review__section">
                <div className="actioned-extension-review__section-head">
                  <h3 className="actioned-extension-review__section-title">Customer Information</h3>
                </div>
                <div className="actioned-extension-review__section-body">
                  <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                    <Descriptions.Item label="Customer Name">
                      {detailRecord.customerName || linkedDeferral.customerName || linkedDeferral.CustomerName || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer Number">
                      {detailRecord.customerNumber || linkedDeferral.customerNumber || linkedDeferral.CustomerNumber || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loan Type">
                      {linkedDeferral.loanType || linkedDeferral.LoanType || "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </section>

              <section className="actioned-extension-review__section">
                <div className="actioned-extension-review__section-head">
                  <h3 className="actioned-extension-review__section-title">Extension Summary</h3>
                </div>
                <div className="actioned-extension-review__section-body">
                  <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                    <Descriptions.Item label="Extension Number">
                      {detailRecord.extensionNumber || detailRecord.ExtensionNumber || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Deferral Number">
                      {detailRecord.deferralNumber || linkedDeferral.deferralNumber || linkedDeferral.DeferralNumber || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {detailRecord.status || detailRecord.Status || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Creator Status">{livePartyStatuses.creatorLabel}</Descriptions.Item>
                    <Descriptions.Item label="Checker Status">{livePartyStatuses.checkerLabel}</Descriptions.Item>
                    <Descriptions.Item label="Approver Status">
                      {`${approvalFlow.filter((item) => item.approved === true || String(item.approvalStatus || item.status || "").toLowerCase() === "approved").length} of ${approvalFlow.length} Approved`}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loan Amount">
                      {linkedDeferral.loanAmountCategory || linkedDeferral.LoanAmountCategory || "Below 75 million"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                      {detailRecord.createdAt || detailRecord.CreatedAt
                        ? dayjs(detailRecord.createdAt || detailRecord.CreatedAt).format("DD MMM YYYY")
                        : "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </section>

              <section className="actioned-extension-review__section">
                <div className="actioned-extension-review__section-head">
                  <h3 className="actioned-extension-review__section-title">Extension Reason</h3>
                </div>
                <div className="actioned-extension-review__section-body">
                  <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap", color: "var(--color-text-medium)" }}>
                    {detailRecord.extensionReason || detailRecord.ExtensionReason || detailRecord.reason || detailRecord.Reason || "-"}
                  </Typography.Paragraph>
                </div>
              </section>
            </div>

            <aside className="actioned-extension-review__comments">
              <div className="creator-caption">History</div>
              <CommentTrail history={extensionHistory} isLoading={false} />
            </aside>
          </div>
        ) : (
          <div>
            <div className="actioned-extension-review__table-shell">
              <div className="actioned-extension-review__section-head">
                <h3 className="actioned-extension-review__section-title">Documents To Be Deferred</h3>
              </div>
              {documentsToBeDeferred.length > 0 ? (
                <Table
                  columns={requestedDocumentColumns}
                  dataSource={documentsToBeDeferred}
                  pagination={false}
                  rowKey={(item, index) => item.id || item._id || `${item.name}-${index}`}
                  scroll={{ x: 640 }}
                />
              ) : (
                <div className="actioned-extension-review__empty"><Empty description="No deferred documents" /></div>
              )}
            </div>

            <div className="actioned-extension-review__table-shell" style={{ marginTop: 16 }}>
              <div className="actioned-extension-review__section-head">
                <h3 className="actioned-extension-review__section-title">Facility Details</h3>
              </div>
              {facilities.length > 0 ? (
                <Table
                  dataSource={facilities}
                  columns={getFacilityColumns()}
                  pagination={false}
                  rowKey={(item, index) => item.facilityNumber || item._id || `facility-${index}`}
                  scroll={{ x: 720 }}
                />
              ) : (
                <div className="actioned-extension-review__empty"><Empty description="No facilities available" /></div>
              )}
            </div>

            <div className="actioned-extension-review__table-shell" style={{ marginTop: 16 }}>
              <div className="actioned-extension-review__section-head">
                <h3 className="actioned-extension-review__section-title">Mandatory DCL Upload</h3>
              </div>
              {dclDocs.length > 0 ? (
                <Table
                  columns={uploadedDocumentColumns}
                  dataSource={dclDocs}
                  pagination={false}
                  rowKey={(item, index) => item.id || item._id || `dcl-${index}`}
                  scroll={{ x: 640 }}
                />
              ) : (
                <div className="actioned-extension-review__empty"><Empty description="No DCL document uploaded" /></div>
              )}
            </div>

            <div className="actioned-extension-review__table-shell" style={{ marginTop: 16 }}>
              <div className="actioned-extension-review__section-head">
                <h3 className="actioned-extension-review__section-title">Additional Documents</h3>
              </div>
              {additionalDocuments.length > 0 ? (
                <Table
                  columns={uploadedDocumentColumns}
                  dataSource={additionalDocuments}
                  pagination={false}
                  rowKey={(item, index) => item.id || item._id || `additional-${index}`}
                  scroll={{ x: 640 }}
                />
              ) : (
                <div className="actioned-extension-review__empty"><Empty description="No additional documents" /></div>
              )}
            </div>

            <div className="actioned-extension-review__table-shell" style={{ marginTop: 16 }}>
              <div className="actioned-extension-review__section-head">
                <h3 className="actioned-extension-review__section-title">Approval Flow</h3>
              </div>
              {approvalFlow.length > 0 ? (
                <Table
                  columns={approvalColumns}
                  dataSource={approvalFlow}
                  pagination={false}
                  rowKey={(item, index) => item._id || `${item.name || item.approverName || "approver"}-${index}`}
                  scroll={{ x: 540 }}
                />
              ) : (
                <div className="actioned-extension-review__empty"><Empty description="No approval flow recorded" /></div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="creator-tab-loading">
        <Spin />
      </div>
    );
  }

  if (extensions.length === 0) {
    return (
      <div className="creator-tab-empty">
        <Empty description="No extension applications" />
      </div>
    );
  }

  return (
    <div className={tableClassName}>
      <Table
        columns={columns}
        dataSource={extensions}
        rowKey={(record) => record._id || record.id}
        tableLayout="fixed"
        size="middle"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          position: ["bottomCenter"],
        }}
        scroll={{ x: 600 }}
        expandable={{
          expandedRowKeys,
          expandedRowRender: renderExpandedRow,
          expandIcon: () => null,
        }}
        onRow={(record) => ({
          onClick: () => {
            toggleExpanded(record);
          },
          style: { cursor: "pointer" },
        })}
      />
    </div>
  );
};

export default ExtensionApplicationsTab;
