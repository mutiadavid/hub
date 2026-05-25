/**
 * Actioned - Main Orchestrator Component
 * Coordinates data fetching, modal management, and component rendering
 */

import React, { useState } from "react";
import { Card, Tabs, message } from "antd";
import { useSelector } from "react-redux";
import { useActionedData, useDeferralModal, useActionedTabs } from "./hooks";
import { useCommentHandler, useDocumentHandlers, useDocumentBuckets } from "./hooks";
import { ActionedTable, DeferralDetailsModal, ExtensionApplicationsTab } from "./components";
import { customTableStyles, PRIMARY_BLUE } from "./utils";
import { downloadDeferralAsPDF } from "./utils";
import deferralApi from "../../../service/deferralApi";
import MyQueueExtensionApplicationModal from "../MyQueue/components/ExtensionApplicationModal";
import "../../../styles/creatorDesignSystem.css";

const actionedPageStyles = `
  .approver-actioned-page,
  .approver-actioned-page * {
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif !important;
  }

  .approver-actioned-page {
  }

  .approver-actioned-shell {
    width: 100%;
  }

  .approver-actioned-card {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    overflow: hidden;
  }

  .approver-actioned-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-bg);
  }

  .approver-actioned-title {
    color: var(--color-text-dark);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .approver-actioned-copy {
    margin: 0;
    color: var(--color-text-dark);
    font-size: 11px;
    line-height: 1.5;
  }

  .approver-actioned-tabs .ant-tabs-nav {
    margin-bottom: 0;
    padding: 0 16px;
    background: var(--color-white);
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }

  .approver-actioned-tabs .ant-tabs-nav::before {
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    display: block !important;
  }

  .approver-actioned-tabs .ant-tabs-nav-wrap {
    overflow: auto;
  }

  .approver-actioned-tabs .ant-tabs-tab {
    border: none !important;
    background: transparent !important;
    border-radius: 0 !important;
    padding: 10px 8px 8px !important;
    color: var(--color-text-light);
    font-size: 11px;
    font-weight: 500;
    margin: 0 24px 0 0 !important;
  }

  .approver-actioned-tabs .ant-tabs-tab-active {
    background: transparent !important;
    border-color: transparent !important;
  }

  .approver-actioned-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: var(--color-primary-dark) !important;
    font-weight: 400;
  }

  .approver-actioned-tabs .ant-tabs-ink-bar {
    display: block !important;
    height: 2px !important;
    background: var(--color-primary-dark) !important;
    border-radius: 0 !important;
  }

  .approver-actioned-tab-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .approver-actioned-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(214, 189, 152, 0.18);
    color: var(--color-text-dark);
    font-size: 10px;
    font-weight: 400;
  }

  .approver-actioned-table {
    background: var(--color-white);
    border-radius: 8px;
    padding: 0 16px 16px;
  }

  .approver-actioned-table .ant-table,
  .approver-actioned-table .ant-table-wrapper,
  .approver-actioned-table .ant-spin-nested-loading,
  .approver-actioned-table .ant-spin-container,
  .approver-actioned-table .ant-table-container,
  .approver-actioned-table .ant-table-content,
  .approver-actioned-table table,
  .approver-actioned-table thead,
  .approver-actioned-table tbody,
  .approver-actioned-table tr {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .approver-actioned-table .ant-table {
    table-layout: fixed;
    width: 100%;
  }

  .approver-actioned-table .ant-table-content {
    overflow-x: hidden;
  }

  .approver-actioned-table .ant-table-header,
  .approver-actioned-table .ant-table-body,
  .approver-actioned-table .ant-table-placeholder,
  .approver-actioned-table .ant-empty,
  .approver-actioned-table .ant-empty-normal {
    background: inherit !important;
  }

  .approver-actioned-table .ant-table-thead > tr > th {
    background: transparent !important;
    color: var(--color-text-medium, #6b7280) !important;
    font-weight: 600 !important;
    font-size: 10px !important;
    padding: 8px 12px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    border-right: none !important;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .approver-actioned-table .ant-table-tbody > tr > td {
    background: transparent !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
    border-top: none !important;
    border-right: none !important;
    padding: 8px 12px !important;
    font-size: 11px !important;
    color: var(--color-text-dark);
    line-height: 1.25;
  }

  .approver-actioned-table .ant-table-thead > tr > th::before,
  .approver-actioned-table .ant-table-cell::before,
  .approver-actioned-table .ant-table-cell::after,
  .approver-actioned-table .ant-table-wrapper::before,
  .approver-actioned-table .ant-table-wrapper::after,
  .approver-actioned-table .ant-table-container::before,
  .approver-actioned-table .ant-table-container::after,
  .approver-actioned-table .ant-table-thead > tr::after,
  .approver-actioned-table .ant-table-tbody > tr::after {
    display: none !important;
  }

  .approver-actioned-table .ant-table-tbody > tr:hover > td {
    background-color: rgba(214, 189, 152, 0.06) !important;
  }

  .approver-actioned-table .ant-table-tbody > tr > td:first-child,
  .approver-actioned-table .ant-table-thead > tr > th:first-child {
    padding-left: 0 !important;
  }

  .approver-actioned-table .ant-table-tbody > tr > td:last-child,
  .approver-actioned-table .ant-table-thead > tr > th:last-child {
    padding-right: 0 !important;
  }

  .approver-actioned-table .ant-pagination {
    margin-top: 18px !important;
    margin-bottom: 0 !important;
  }

  .approver-actioned-table .ant-pagination .ant-pagination-item,
  .approver-actioned-table .ant-pagination .ant-pagination-prev,
  .approver-actioned-table .ant-pagination .ant-pagination-next {
    border-radius: 999px !important;
    border-color: transparent !important;
    background: transparent !important;
    min-width: 34px;
  }

  .approver-actioned-table .ant-pagination .ant-pagination-item-active {
    background: rgba(214, 189, 152, 0.18) !important;
    border-color: rgba(214, 189, 152, 0.18) !important;
  }

  .approver-actioned-table .ant-pagination .ant-pagination-item-active a {
    color: var(--color-text-dark) !important;
    font-weight: 400;
  }

  .creator-tab-empty,
  .creator-tab-loading {
    padding: 24px 16px;
    background: var(--color-white);
  }

  @media (max-width: 768px) {
    .approver-actioned-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .approver-actioned-tabs .ant-tabs-nav {
      padding: 0;
    }

    .approver-actioned-tabs .ant-tabs-tab {
      margin-right: 22px !important;
      padding-top: 12px !important;
      padding-bottom: 10px !important;
      font-size: 12px;
    }

    .approver-actioned-table .ant-table-thead > tr > th,
    .approver-actioned-table .ant-table-tbody > tr > td {
      padding-top: 12px !important;
      padding-bottom: 12px !important;
    }
  }
`;

/**
 * Actioned - Main component for viewing completed/actioned deferrals
 * @returns {JSX.Element} - Full actioned deferrals view
 */
const Actioned = () => {
  const token = useSelector((state) => state.auth.token);
  // Data fetching
  const {
    deferrals,
    extensions,
    loading,
    extensionsLoading,
    refetch,
    setDeferrals,
  } = useActionedData();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);

  // Deferral polling while modal open
  const { deferral: selectedPolled } = useDeferralModal(selected, modalOpen, token);

  // Tab management
  const { activeTab, handleTabChange } = useActionedTabs("deferrals");

  // Comment handling
  const { newComment, setNewComment, postingComment, handlePostComment } =
    useCommentHandler(selectedPolled, (refreshedDeferral) => {
      setSelected(refreshedDeferral);
      setDeferrals((prev) =>
        prev.map((d) =>
          d._id === refreshedDeferral._id ? refreshedDeferral : d,
        ),
      );
    });

  // Document handling
  const { handleViewDocument, handleDownloadDocument } =
    useDocumentHandlers();
  const { dclDocs, uploadedDocs, requestedDocs } = useDocumentBuckets(
    selectedPolled || selected,
  );

  // PDF download state
  const [downloadLoading, setDownloadLoading] = useState(false);
  const showDeferralDetails = modalOpen && !!(selectedPolled || selected);
  const showExtensionDetails = extensionModalOpen && !!selectedExtension;

  const handleDownloadPDF = async () => {
    if (!selectedPolled && !selected) {
      message.error("No deferral selected");
      return;
    }
    setDownloadLoading(true);
    try {
      await downloadDeferralAsPDF(selectedPolled || selected);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Handle table row click
  const handleTableRowClick = async (record) => {
    setSelected(record);
    setModalOpen(true);

    try {
      const recordId = record?._id || record?.id;
      if (!recordId) {
        return;
      }

      const freshDeferral = await deferralApi.getDeferralById(recordId, token);
      setSelected(freshDeferral);
    } catch (error) {
      console.error("Failed to load actioned deferral details:", error);
    }
  };

  // Handle extension click
  const handleExtensionClick = (extension) => {
    const openExtension = async () => {
      try {
        const extensionId = extension?._id || extension?.id;
        const freshExtension = extensionId
          ? await deferralApi.getExtensionById(extensionId, token)
          : extension;
        const deferralId =
          freshExtension?.deferralId ||
          freshExtension?.deferral?._id ||
          freshExtension?.deferral?.id ||
          extension?.deferralId;
        const fullDeferral = deferralId
          ? await deferralApi.getDeferralById(deferralId, token)
          : freshExtension?.deferral || null;

        setSelectedExtension({
          ...freshExtension,
          deferral: fullDeferral || freshExtension?.deferral || null,
          linkedDeferral: fullDeferral || freshExtension?.linkedDeferral || freshExtension?.deferral || null,
        });
        setExtensionModalOpen(true);
      } catch (error) {
        console.error("Failed to open actioned extension details:", error);
        message.error("Failed to load extension details");
      }
    };

    openExtension();
  };

  const renderTabLabel = (label, count) => (
    <span className="approver-actioned-tab-label">
      <span>{label}</span>
      <span className="approver-actioned-tab-count">{count}</span>
    </span>
  );

  const tabsItems = [
    {
      key: "deferrals",
      label: renderTabLabel("Deferrals", deferrals.length),
      children: (
        <ActionedTable
          deferrals={deferrals}
          loading={loading}
          onRowClick={handleTableRowClick}
          tableClassName="approver-actioned-table"
        />
      ),
    },
    {
      key: "extensions",
      label: renderTabLabel("Extension Applications", extensions.length),
      children: (
        <ExtensionApplicationsTab
          extensions={extensions}
          loading={extensionsLoading}
          tableClassName="approver-actioned-table"
          onOpenExtensionDetails={handleExtensionClick}
        />
      ),
    },
  ];

  return (
    <div className="approver-actioned-page creator-theme">
      <style>{actionedPageStyles}</style>
      <style>{customTableStyles}</style>
      <div className="approver-actioned-shell">
        <div className="approver-actioned-card">
          {showDeferralDetails ? (
            <DeferralDetailsModal
              deferral={selectedPolled || selected}
              open={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setSelected(null);
              }}
              newComment={newComment}
              onCommentChange={setNewComment}
              onPostComment={handlePostComment}
              postingComment={postingComment}
              handleViewDocument={handleViewDocument}
              handleDownloadDocument={handleDownloadDocument}
              dclDocs={dclDocs}
              uploadedDocs={uploadedDocs}
              requestedDocs={requestedDocs}
              downloadLoading={downloadLoading}
            />
          ) : showExtensionDetails ? (
            <MyQueueExtensionApplicationModal
              selectedExtension={selectedExtension}
              open={extensionModalOpen}
              onClose={() => {
                setExtensionModalOpen(false);
                setSelectedExtension(null);
              }}
              onApprove={() => {}}
              onReject={() => {}}
              approveLoading={false}
              rejectLoading={false}
              showActions={false}
            />
          ) : (
            <>
              <div className="approver-actioned-toolbar">
                <div>
                  <h2 className="approver-actioned-title">Completed Work</h2>
                  <p className="approver-actioned-copy">
                    Review finalized deferrals and extension applications in the same compact queue workspace.
                  </p>
                </div>
              </div>

              <Tabs
                className="approver-actioned-tabs"
                activeKey={activeTab}
                onChange={handleTabChange}
                items={tabsItems}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Actioned;
