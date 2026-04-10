// export default MyQueue;
import React, { useState, useMemo, useCallback } from "react";
import {
  Button,
  Table,
  Spin,
  Empty,
  Input,
  Typography,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { formatDateTime } from "../../utils/checklistUtils";
import { getStatusColor } from "../../utils/statusColors";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";

import RmReviewChecklistModal from "../../components/modals/RmReviewChecklistModalComponents/RmReviewChecklistModal";
import { useGetAllCoCreatorChecklistsQuery, useLockDclMutation } from "../../api/checklistApi";
import { showLockToast } from "../../utils/authToast";
import { useEffect } from "react";
import "../../styles/creatorDesignSystem.css";

const { Text } = Typography;

const MyQueue = ({
  userId,
  draftToRestore = null,
  setDraftToRestore = null,
}) => {
  const auth = useSelector((state) => state.auth);
  const currentUserId = auth?.user?.id || auth?.user?._id || auth?.user?.userId || auth?.id || auth?._id;
  const currentUserName = auth?.user?.name || auth?.user?.username || auth?.name || auth?.username || "Current User";
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [lockDcl] = useLockDclMutation();

  const getLockMeta = useCallback(
    (checklist) => {
      const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
      const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
      const isLockedBySomeoneElse =
        Boolean(lockedByUserId) && String(lockedByUserId) !== String(currentUserId);
      const isLockedByMe =
        Boolean(lockedByUserId) && String(lockedByUserId) === String(currentUserId);

      return {
        lockedByUserId,
        lockedByUserName,
        isLockedBySomeoneElse,
        isLockedByMe,
      };
    },
    [currentUserId],
  );

  const openChecklist = useCallback(
    async (checklist) => {
      const checklistId = checklist?.id || checklist?._id;
      const { isLockedBySomeoneElse, isLockedByMe, lockedByUserName } = getLockMeta(checklist);

      if (!checklistId) {
        return;
      }

      if (isLockedBySomeoneElse) {
        showLockToast(lockedByUserName || "another user");
        return;
      }

      if (!isLockedByMe) {
        try {
          await lockDcl(checklistId).unwrap();
        } catch (error) {
          if (error?.data?.lockedByUserId) {
            showLockToast(error?.data?.lockedByUserName || "another user");
            return;
          }

          console.error("Failed to lock DCL before opening RM modal:", error);
          return;
        }
      }

      setSelectedChecklist({
        ...checklist,
        lockedByUserId: currentUserId,
        lockedByUserName: currentUserName,
        lockedBy: { id: currentUserId, name: currentUserName },
      });
      setModalOpen(true);
    },
    [currentUserId, currentUserName, getLockMeta, lockDcl],
  );

  // Handle draft restoration - open modal with draft data
  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      console.log("🔄 RM MyQueue - Restoring draft:", draftToRestore);

      // Reconstruct checklist object from draft data
      const draftChecklist = {
        id: draftToRestore.data.checklistId || draftToRestore.id,
        _id: draftToRestore.data.checklistId || draftToRestore.id,
        dclNo: draftToRestore.data.dclNo,
        title: draftToRestore.data.title,
        customerName: draftToRestore.data.customerName,
        customerNumber: draftToRestore.data.customerNumber,
        loanType: draftToRestore.data.loanType,
        status: draftToRestore.data.status,
        documents: draftToRestore.data.documents || [],
        supportingDocs: draftToRestore.data.supportingDocs || [],
        rmGeneralComment:
          draftToRestore.data.rmGeneralComment ||
          draftToRestore.data.creatorComment ||
          "",
        // Also include the draft metadata for debugging
        _draftRestored: true,
        _rmComment:
          draftToRestore.data.rmGeneralComment ||
          draftToRestore.data.creatorComment ||
          "",
        _supportingDocs: draftToRestore.data.supportingDocs || [],
        commentTrail: draftToRestore.data.commentTrail || [],
        _draftCommentTrail: draftToRestore.data.commentTrail || [],
      };

      console.log(
        "✅ RM MyQueue - Opening modal with restored checklist:",
        draftChecklist,
      );

      setTimeout(() => {
        setSelectedChecklist(draftChecklist);
        setModalOpen(true);
      }, 0);

      // Clear the draft restore after a delay to ensure modal has received the data
      setTimeout(() => {
        if (setDraftToRestore) {
          setDraftToRestore(null);
        }
      }, 100);
    }
  }, [draftToRestore, setDraftToRestore]);

  // Fetch all checklists
  const {
    data: checklists = [],
    isLoading,
    refetch,
  } = useGetAllCoCreatorChecklistsQuery(undefined, {
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Filter checklists assigned to this RM and queue status
  const filteredData = useMemo(() => {
    if (!checklists) return [];

    return (
      checklists
        .filter((c) => (c.assignedToRM?.id || c.assignedToRM?._id) === userId)
        .filter((c) => {
          const status = (c.status || "").toLowerCase();
          return status === "rmreview";
        })

        // Map and Inject the displayStatus field
        .map((c) => {
          return {
            ...c,
            // Set the displayStatus property for the Table column
            displayStatus: c.status,
          };
        })

        .filter((c) => {
          if (!searchText) return true;
          const q = searchText.toLowerCase();
          return (
            c.dclNo?.toLowerCase().includes(q) ||
            c.customerNumber?.toLowerCase().includes(q) ||
            c.customerName?.toLowerCase().includes(q) ||
            c.loanType?.toLowerCase().includes(q) ||
            c.createdBy?.name?.toLowerCase().includes(q)
          );
        })
        // Sort by most recent first (using updatedAt or createdAt)
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA; // Descending order (most recent first)
        })
    );
  }, [checklists, userId, searchText]);

  const clearFilters = () => setSearchText("");

  const isReviewOpen = modalOpen && !!selectedChecklist;

  const renderStatusTag = (status) => {
    const statusConfig = getStatusColor(status);
    const normalizedStatus = (status || "").toLowerCase();
    const isPending = normalizedStatus.includes("pending");

    return (
      <span
        className="rm-queue-status-text"
        style={{
          fontWeight: 600,
          fontSize: 12,
          color: isPending ? "#FF4D4F" : statusConfig.textColor,
        }}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="rm-queue-primary-cell">
          <span className="rm-queue-primary-value">{text || "-"}</span>
          <span className="rm-queue-secondary-value">Document checklist</span>
        </div>
      ),
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 132,
      ellipsis: true,
      render: (text) => (
        <div className="rm-queue-muted">{text || "-"}</div>
      ),
    },
    {
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 148,
      ellipsis: true,
      render: (text) => (
        <div className="rm-queue-primary-value" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <UserOutlined style={{ color: "var(--color-text-light)", fontSize: 12 }} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "IBPS NO",
      dataIndex: "ibpsNo",
      width: 98,
      ellipsis: true,
      render: (text) => (
        <div className="rm-queue-muted" style={{ fontFamily: "monospace" }}>
          {text || "Not set"}
        </div>
      ),
    },

    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => (
        <div className="rm-queue-muted">{text || "-"}</div>
      ),
    },
    {
      title: "CREATOR",
      dataIndex: "createdBy",
      width: 132,
      ellipsis: true,
      render: (creator) => (
        <div className="rm-queue-muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <UserOutlined style={{ color: "var(--color-text-light)", fontSize: 12 }} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {creator?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "RM",
      dataIndex: "assignedToRM",
      width: 132,
      ellipsis: true,
      render: (rm) => (
        <div className="rm-queue-muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <UserOutlined style={{ color: "var(--color-text-light)", fontSize: 12 }} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {rm?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs) => {
        const totalDocs =
          docs?.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;
        return (
          <span className="rm-queue-primary-value">
            {totalDocs}
          </span>
        );
      },
    },
    {
      title: "STATUS",
      dataIndex: "displayStatus",
      width: 135,
      render: (status) => renderStatusTag(status),
    },
    {
      title: "LOCK",
      width: 136,
      ellipsis: true,
      render: (_, record) => {
        const { isLockedByMe, isLockedBySomeoneElse, lockedByUserName } = getLockMeta(record);

        if (isLockedByMe) {
          return <span className="creator-lock-badge creator-lock-badge--mine">Locked by you</span>;
        }

        if (isLockedBySomeoneElse) {
          return (
            <span className="creator-lock-badge creator-lock-badge--locked" title={lockedByUserName || "Locked"}>
              {`Locked by ${lockedByUserName || "user"}`}
            </span>
          );
        }

        return <span className="creator-lock-badge creator-lock-badge--open">Available</span>;
      },
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      width: 100,
      fixed: "right",
      render: (date, record) => (
        <RealTimeSlaTag
          slaExpiry={date}
          startedAt={record?.createdAt}
          emptyLabel="N/A"
          minWidth={60}
          fontSize={12}
          displayStyle="text"
        />
      ),
    },
  ];

  const customTableStyles = `
    .rm-queue-page {
      min-height: 100%;
      width: 100%;
      background: var(--color-bg);
      font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
    }
    .rm-queue-shell {
      width: 100%;
    }
    .rm-queue-card {
      background: var(--color-white);
      border: 1px solid rgba(214, 189, 152, 0.2);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
      overflow: hidden;
    }
    .rm-queue-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
      flex-wrap: wrap;
      padding: 16px;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-bg);
    }
    .rm-queue-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 240px;
    }
    .rm-queue-title {
      color: var(--color-text-dark);
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .rm-queue-subtitle {
      color: var(--color-text-light);
      font-size: 12px;
      margin: 0;
    }
    .rm-queue-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
      flex: 1;
    }
    .rm-queue-count {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-white);
      border-radius: 999px;
      padding: 9px 14px;
      color: var(--color-text-light);
      font-size: 12px;
      font-weight: 500;
    }
    .rm-queue-count strong {
      color: var(--color-text-dark);
      font-weight: 700;
    }
    .rm-queue-search {
      width: min(420px, 100%);
    }
    .rm-queue-search.ant-input-affix-wrapper {
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      box-shadow: none !important;
    }
    .rm-queue-search.ant-input-affix-wrapper:hover,
    .rm-queue-search.ant-input-affix-wrapper:focus,
    .rm-queue-search.ant-input-affix-wrapper-focused {
      border-color: var(--color-primary-dark) !important;
      box-shadow: none !important;
    }
    .rm-queue-search input {
      background: transparent !important;
      font-size: 12px !important;
      color: var(--color-text-medium) !important;
    }
    .rm-queue-search .anticon {
      color: var(--color-text-light);
    }
    .rm-queue-clear.ant-btn {
      min-height: 40px !important;
      padding: 0 14px !important;
      border-radius: 6px !important;
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      color: var(--color-text-medium) !important;
      box-shadow: none !important;
      font-size: 12px !important;
      font-weight: 600 !important;
    }
    .rm-queue-clear.ant-btn:hover,
    .rm-queue-clear.ant-btn:focus {
      border-color: var(--color-primary-dark) !important;
      color: var(--color-primary-dark) !important;
    }
    .rm-myqueue-table {
      background: var(--color-white);
      border-radius: 8px;
      padding: 0 16px 16px;
    }
    .rm-myqueue-table .ant-table,
    .rm-myqueue-table .ant-table-wrapper,
    .rm-myqueue-table .ant-spin-nested-loading,
    .rm-myqueue-table .ant-spin-container,
    .rm-myqueue-table .ant-table-container,
    .rm-myqueue-table .ant-table-content,
    .rm-myqueue-table table,
    .rm-myqueue-table thead,
    .rm-myqueue-table tbody,
    .rm-myqueue-table tr {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .rm-myqueue-table .ant-table {
      table-layout: fixed;
      width: 100%;
    }
    .rm-myqueue-table .ant-table-container {
      background: inherit !important;
    }
    .rm-myqueue-table .ant-table-content {
      overflow-x: hidden;
    }
    .rm-myqueue-table .ant-table-header,
    .rm-myqueue-table .ant-table-body,
    .rm-myqueue-table .ant-table-placeholder,
    .rm-myqueue-table .ant-empty,
    .rm-myqueue-table .ant-empty-normal {
      background: inherit !important;
    }
    .rm-myqueue-table .ant-table-thead > tr > th {
      background: transparent !important;
      color: var(--color-text-medium) !important;
      font-weight: 600;
      font-size: 11px;
      padding: 14px 12px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      border-right: none !important;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .rm-myqueue-table .ant-table-tbody > tr > td {
      background: transparent !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
      border-top: none !important;
      border-right: none !important;
      padding: 16px 12px !important;
      font-size: 12px;
      color: var(--color-text-medium);
      line-height: 1.25;
    }
    .rm-myqueue-table .ant-table-thead > tr > th::before,
    .rm-myqueue-table .ant-table-cell::before,
    .rm-myqueue-table .ant-table-cell::after,
    .rm-myqueue-table .ant-table-wrapper::before,
    .rm-myqueue-table .ant-table-wrapper::after,
    .rm-myqueue-table .ant-table-container::before,
    .rm-myqueue-table .ant-table-container::after,
    .rm-myqueue-table .ant-table-thead > tr::after,
    .rm-myqueue-table .ant-table-tbody > tr::after {
      display: none !important;
    }
    .rm-myqueue-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(214, 189, 152, 0.06) !important;
      cursor: pointer;
    }
    .rm-myqueue-table .ant-table-tbody > tr > td:first-child,
    .rm-myqueue-table .ant-table-thead > tr > th:first-child {
      padding-left: 0 !important;
    }
    .rm-myqueue-table .ant-table-tbody > tr > td:last-child,
    .rm-myqueue-table .ant-table-thead > tr > th:last-child {
      padding-right: 0 !important;
    }
    .rm-myqueue-table .ant-pagination {
      margin-top: 18px !important;
      margin-bottom: 0 !important;
    }
    .rm-myqueue-table .ant-pagination .ant-pagination-item,
    .rm-myqueue-table .ant-pagination .ant-pagination-prev,
    .rm-myqueue-table .ant-pagination .ant-pagination-next {
      border-radius: 999px !important;
      border-color: transparent !important;
      background: transparent !important;
      min-width: 34px;
    }
    .rm-myqueue-table .ant-pagination .ant-pagination-item-active {
      background: rgba(214, 189, 152, 0.18) !important;
      border-color: rgba(214, 189, 152, 0.18) !important;
    }
    .rm-myqueue-table .ant-pagination .ant-pagination-item-active a {
      color: var(--color-text-dark) !important;
      font-weight: 700;
    }
    .rm-queue-primary-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .rm-queue-primary-value {
      color: var(--color-text-dark);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rm-queue-secondary-value {
      color: var(--color-text-light);
      font-size: 8px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rm-queue-muted {
      color: var(--color-text-medium);
      font-size: 12px;
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .creator-lock-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid transparent;
    }
    .creator-lock-badge--mine {
      background: rgba(82, 196, 26, 0.12);
      color: #237804;
      border-color: rgba(82, 196, 26, 0.18);
    }
    .creator-lock-badge--locked {
      background: rgba(255, 77, 79, 0.1);
      color: #C62828;
      border-color: rgba(255, 77, 79, 0.14);
    }
    .creator-lock-badge--open {
      background: rgba(64, 83, 76, 0.08);
      color: var(--color-text-medium);
      border-color: rgba(64, 83, 76, 0.14);
    }
    .rm-queue-state,
    .rm-queue-footer {
      padding: 16px;
      background: var(--color-white);
    }
    .rm-queue-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      border-top: 1px solid rgba(214, 189, 152, 0.2);
      color: var(--color-text-light);
      font-size: 12px;
    }
    @media (max-width: 768px) {
      .rm-queue-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .rm-queue-toolbar-actions {
        justify-content: stretch;
      }
      .rm-queue-search {
        width: 100%;
      }
      .rm-myqueue-table .ant-table-thead > tr > th,
      .rm-myqueue-table .ant-table-tbody > tr > td {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
      }
    }
  `;

  return (
    <div className="rm-queue-page creator-theme" style={{ boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>
      {isReviewOpen ? (
        <RmReviewChecklistModal
          checklist={selectedChecklist}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedChecklist(null);
            refetch();
          }}
        />
      ) : (
        <div className="rm-queue-shell">
          <div className="rm-queue-card">
            <div className="rm-queue-toolbar">
              <div className="rm-queue-title-wrap">
                <h2 className="rm-queue-title">My Queue</h2>
                <p className="rm-queue-subtitle">Upload documents for DCLs assigned to you</p>
              </div>

              <div className="rm-queue-toolbar-actions">
                <span className="rm-queue-count">
                  Total
                  <strong>{filteredData.length}</strong>
                </span>
                <Input
                  placeholder="Search by DCL No, Customer, Loan Type, or Creator"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  className="rm-queue-search"
                />
                <Button onClick={clearFilters} className="rm-queue-clear">
                  Clear
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="rm-queue-state">
                <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="rm-queue-state">
                <Empty
                  description={
                    <div>
                      <p style={{ fontSize: 16, marginBottom: 8 }}>
                        No DCLs pending upload
                      </p>
                      <p style={{ color: "var(--color-text-light)" }}>
                        {searchText
                          ? "Try changing your search term"
                          : "No DCLs assigned to you yet"}
                      </p>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="rm-myqueue-table">
                <Table
                  columns={columns}
                  dataSource={filteredData}
                  rowKey={(record) => record.id || record._id || record.dclNo}
                  size="middle"
                  tableLayout="fixed"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    position: ["bottomCenter"],
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} DCLs`,
                  }}
                  scroll={{ x: 1266 }}
                  onRow={(record) => ({
                    onClick: () => {
                      openChecklist(record);
                    },
                  })}
                />
              </div>
            )}

            <div className="rm-queue-footer">
              <div>Report generated on: {formatDateTime(new Date())}</div>
              <Text type="secondary">
                Showing {filteredData.length} items • Data as of latest system update
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQueue;
