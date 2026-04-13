import React, { useMemo, useState } from "react";
import { Button } from "antd";
import { CloseOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";

import ChecklistInfoCard from "./ChecklistInfoCard";
import DocumentSummary from "./DocumentSummary";
import DocumentsTable from "./DocumentsTable";
import CommentHistorySection from "./CommentHistorySection";
import DocumentSidebarComponent from "./DocumentSidebarComponent";
import PDFGenerator from "./PDFGenerator";
import "../../../styles/creatorDesignSystem.css";

const TABS = [
  { key: "details", label: "Checklist Details" },
  { key: "documents", label: "Required Documents" },
];

const CompletedChecklistModal = ({
  checklist,
  open,
  onClose,
  embedded = false,
}) => {
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [activeTab, setActiveTab] = useState("details");

  const { docs, documentCounts } = useChecklistDocuments(checklist);

  React.useEffect(() => {
    if (checklist?.supportingDocs && Array.isArray(checklist.supportingDocs)) {
      setSupportingDocs(checklist.supportingDocs);
    } else {
      setSupportingDocs([]);
    }
  }, [checklist, checklist?.supportingDocs]);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  const isSystemGeneratedMessage = (text = "") => {
    if (!text) return true;
    const message = text.toLowerCase().trim();
    const systemPatterns = [
      "submitted to",
      "returned to",
      "approved by",
      "rejected by",
      "completed",
      "status updated",
      "initiated",
      "submitted for",
      "sent to",
      "assigned to",
      "document uploaded",
      "checklist created",
      "draft saved",
      "revived from",
      "submitted to co-checker",
      "submitted to co",
      "submitted to rm",
      "checklist updated",
      "documents updated",
      "submitted back to co-creator",
      "returned to co-creator",
      "sent for approval",
      "approved checklist",
      "rejected checklist",
      "supporting document",
      "document reference",
      "file uploaded",
      "status changed",
      "status: ",
      "checklist status",
      "has been",
      "document",
    ];
    return systemPatterns.some((pattern) => message.includes(pattern));
  };

  const userComments = React.useMemo(() => {
    if (!comments || !Array.isArray(comments)) return [];
    return comments.filter((item) => {
      const role = (item.userId?.role || item.role || "").toLowerCase();
      const message = item.message || item.comment || "";
      const isSystem = isSystemGeneratedMessage(message);
      const isEmpty = !message.trim();

      if (role === "system") return false;
      if (isSystem) return false;
      if (isEmpty) return false;
      return true;
    });
  }, [comments]);

  React.useEffect(() => {
    console.log("🔍 CompletedChecklistModal - Checklist data:", checklist);
    console.log("👤 RM Assigned:", checklist?.assignedToRM);
    console.log("👤 RM ID:", checklist?.assignedToRMId);
    console.log("👤 RM Name:", checklist?.assignedToRM?.name || "Not found");
    console.log("📋 Documents from hook:", docs);
    console.log("📊 Document counts:", documentCounts);

    const checklistId = checklist?.id || checklist?._id;
    console.log("✅ CompletedChecklistModal - Checklist ID for comments:", checklistId);
    console.log("✅ Comments Loading:", commentsLoading);
    console.log("✅ Total raw comments:", comments?.length || 0);
    console.log("✅ User comments (filtered):", userComments.length);
    console.log("✅ Raw comments data:", comments);
    console.log("✅ Filtered user comments:", userComments);
  }, [
    checklist,
    docs,
    documentCounts,
    comments,
    commentsLoading,
    userComments,
  ]);

  const preparedDocs = React.useMemo(
    () =>
      docs.map((doc, index) => ({
        ...doc,
        name: doc.name || doc.documentName || `Document ${index + 1}`,
        category: doc.category || "Other",
        status: doc.status || doc.action || "pending",
        action: doc.action || doc.status || "pending",
        comment: doc.comment || "",
        expiryDate: doc.expiryDate || doc.ExpiryDate || null,
        fileUrl: doc.fileUrl || null,
        checkerStatus:
          doc.checkerStatus || doc.finalCheckerStatus || "approved",
        finalCheckerStatus:
          doc.finalCheckerStatus || doc.checkerStatus || "approved",
        rmStatus: doc.rmStatus || "completed",
        deferralNumber: doc.deferralNumber || doc.deferralNo || null,
      })),
    [docs],
  );

  const preparedChecklist = React.useMemo(
    () => ({
      ...checklist,
      bankName: checklist?.bankName || "NCBA BANK KENYA PLC",
      bankInitials: checklist?.bankInitials || "NCBA",
      dclNo: checklist?.dclNo || "N/A",
      ibpsNo: checklist?.ibpsNo || "Not provided",
      loanType: checklist?.loanType || "N/A",
      customerNumber: checklist?.customerNumber || "N/A",
      customerName: checklist?.customerName || checklist?.customerNumber || "N/A",
      createdBy: checklist?.createdBy || { name: "N/A" },
      assignedToRM: checklist?.assignedToRM || { name: "N/A" },
      assignedToCoChecker: checklist?.assignedToCoChecker || { name: "Pending" },
      status: checklist?.status || "completed",
      createdAt: checklist?.createdAt || new Date().toISOString(),
      completedAt:
        checklist?.completedAt || checklist?.updatedAt || new Date().toISOString(),
      segment: checklist?.segment || "Corporate",
      branch: checklist?.branch || "Head Office",
    }),
    [checklist],
  );

  const uploadedDocumentCount = useMemo(() => {
    const mainDocumentCount = docs.filter((doc) => doc.fileUrl || doc.uploadData?.fileUrl).length;
    const supportingDocumentCount = supportingDocs.filter((doc) => doc.fileUrl).length;
    return mainDocumentCount + supportingDocumentCount;
  }, [docs, supportingDocs]);

  return (
    <>
      <style>{`
        .completed-modal-overlay {
          position: fixed;
          top: 65px;
          left: var(--sidebar-width, 150px);
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 990;
          overflow: auto;
          padding-top: 20px;
          padding-bottom: 20px;
          transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          max-height: 100vh;
        }

        .completed-modal-container {
          background: var(--color-bg);
          border-radius: 12px;
          overflow: hidden;
          width: 1280px;
          max-width: calc(100vw - 310px);
          box-shadow: 0 20px 45px rgba(17, 24, 39, 0.2);
          border: 1px solid rgba(214, 189, 152, 0.2);
          margin: 0 auto;
          position: relative;
          z-index: 1001;
        }

        .completed-review-modal {
          min-height: min(80vh, 860px);
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: var(--color-bg);
        }
        .completed-review-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .completed-review-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }
        .completed-review-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .completed-review-viewdocs {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .completed-review-viewdocs-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(214, 189, 152, 0.2);
          color: var(--color-text-dark);
          font-size: 9px;
          font-weight: 600;
        }
        .completed-review-actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 16px;
        }
        .completed-review-actionbar-inner {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .completed-review-actionbtn.ant-btn,
        .completed-review-actionbar .completed-review-actionbtn.ant-btn {
          min-height: 34px !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .completed-review-actionbtn--primary.ant-btn,
        .completed-review-actionbar .completed-review-actionbtn--primary.ant-btn,
        .completed-review-actionbar .completed-review-actionbtn--primary.ant-btn:hover,
        .completed-review-actionbar .completed-review-actionbtn--primary.ant-btn:focus {
          background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
          border-color: transparent !important;
          color: #ffffff !important;
        }
        .completed-review-actionbtn--secondary.ant-btn,
        .completed-review-actionbar .completed-review-actionbtn--secondary.ant-btn {
          background: var(--color-white) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-medium) !important;
        }
        .completed-review-actionbtn--secondary.ant-btn:hover,
        .completed-review-actionbtn--secondary.ant-btn:focus {
          border-color: var(--color-primary-dark) !important;
          color: var(--color-primary-dark) !important;
          background: rgba(214, 189, 152, 0.08) !important;
        }
        .completed-review-layout {
          display: block;
        }
        .completed-review-main {
          min-width: 0;
        }
        .completed-review-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 16px;
          align-items: start;
        }
        .completed-review-details-main {
          min-width: 0;
        }
        .completed-review-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .completed-review-tab {
          padding: 6px 12px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--color-text-light);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: color 150ms, border-color 150ms;
          white-space: nowrap;
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
        }
        .completed-review-tab:hover {
          color: var(--color-primary-medium);
        }
        .completed-review-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }
        @media (min-width: 768px) and (max-width: 1099px) {
          .completed-modal-overlay {
            left: var(--sidebar-width, 40px);
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
          .completed-modal-container {
            width: calc(100vw - 120px) !important;
            max-width: calc(100vw - 120px) !important;
            margin: 0 16px 0 16px !important;
          }
        }
        @media (max-width: 1023px) {
          .completed-review-details-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 767px) {
          .completed-modal-overlay {
            left: 0;
            padding-left: 0;
            padding-right: 16px;
          }
          .completed-modal-container {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
            margin: 0 16px 0 0 !important;
          }
          .completed-review-modal {
            padding: 16px;
          }
        }
      `}</style>

      <div
        className="completed-modal-overlay"
        style={{
          display: open ? "flex" : "none",
          position: embedded ? "relative" : "fixed",
          top: embedded ? "auto" : 65,
          left: embedded ? 0 : "var(--sidebar-width, 150px)",
          right: embedded ? "auto" : 0,
          bottom: embedded ? "auto" : 0,
          width: embedded ? "100%" : "auto",
          backgroundColor: embedded ? "transparent" : "rgba(0, 0, 0, 0.4)",
          paddingTop: embedded ? 0 : 20,
          paddingBottom: embedded ? 0 : 20,
          alignItems: embedded ? "stretch" : "flex-start",
          overflow: embedded ? "visible" : "auto",
          zIndex: embedded ? "auto" : 990,
        }}
        onClick={embedded ? undefined : onClose}
      >
        {open && (
          <div
            className="completed-modal-container creator-theme"
            style={{
              width: embedded ? "100%" : 1280,
              maxWidth: embedded ? "100%" : "calc(100vw - 310px)",
              borderRadius: embedded ? 16 : 12,
              boxShadow: embedded ? "0 12px 28px rgba(17, 24, 39, 0.08)" : undefined,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <DocumentSidebarComponent
              documents={docs}
              supportingDocs={supportingDocs}
              open={showDocumentSidebar}
              onClose={() => setShowDocumentSidebar(false)}
            />

            <div className="completed-review-modal">
              <div className="completed-review-topbar">
                <div>
                  <h1 className="completed-review-title">
                    {preparedChecklist?.dclNo || preparedChecklist?.title || "Completed Checklist"}
                  </h1>
                  <div className="completed-review-subtitle">
                    {preparedChecklist?.customerName || "Completed checklist workspace"}
                  </div>
                </div>

                <Button
                  className="completed-review-viewdocs"
                  onClick={() => setShowDocumentSidebar(true)}
                >
                  <UnorderedListOutlined />
                  View Documents
                  <span className="completed-review-viewdocs-count">
                    {uploadedDocumentCount}
                  </span>
                </Button>
              </div>

              <div className="completed-review-actionbar">
                <div className="completed-review-actionbar-inner">
                  <PDFGenerator
                    checklist={preparedChecklist}
                    docs={preparedDocs}
                    supportingDocs={supportingDocs}
                    creatorComment={checklist?.creatorComment || ""}
                    comments={userComments}
                    className="completed-review-actionbtn completed-review-actionbtn--primary"
                  />
                  <Button
                    key="close"
                    icon={<CloseOutlined />}
                    onClick={onClose}
                    className="completed-review-actionbtn completed-review-actionbtn--secondary"
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="completed-review-layout">
                <div className="completed-review-main">
                  <div className="completed-review-tabs">
                    {TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`completed-review-tab ${activeTab === tab.key ? "completed-review-tab--active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {checklist && activeTab === "details" && (
                    <div className="completed-review-details-layout">
                      <div className="completed-review-details-main">
                        <ChecklistInfoCard checklist={preparedChecklist} />
                        <DocumentSummary documentCounts={documentCounts} />
                      </div>

                      <CommentHistorySection
                        comments={userComments}
                        commentsLoading={commentsLoading}
                      />
                    </div>
                  )}

                  {checklist && activeTab === "documents" && (
                    <div className="creator-table-shell">
                      <DocumentsTable docs={docs} checklist={preparedChecklist} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CompletedChecklistModal;
