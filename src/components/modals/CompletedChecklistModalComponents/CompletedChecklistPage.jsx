import React from "react";
import { Button, Empty, Spin } from "antd";
import {
  LeftOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  useGetChecklistCommentsQuery,
  useGetCoCreatorChecklistByIdQuery,
} from "../../../api/checklistApi";
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

const CompletedChecklistPage = ({
  checklistId: checklistIdProp,
  initialChecklist = null,
  onClose,
}) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = checklistIdProp || routeId;
  const routeRoot = React.useMemo(() => {
    const [, section] = location.pathname.split("/");
    return section ? `/${section}/completed` : "/rm/completed";
  }, [location.pathname]);
  const handleClose = onClose || (() => navigate(routeRoot));

  const [activeTab, setActiveTab] = React.useState(
    location.state?.initialTab === "documents" ? "documents" : "details",
  );
  const [showDocumentSidebar, setShowDocumentSidebar] = React.useState(false);
  const [supportingDocs, setSupportingDocs] = React.useState([]);

  const {
    data: fetchedChecklist,
    isLoading,
    isFetching,
  } = useGetCoCreatorChecklistByIdQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const checklist = fetchedChecklist || initialChecklist;
  const checklistId = checklist?.id || checklist?._id;
  const { docs, documentCounts } = useChecklistDocuments(checklist);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklistId, {
      skip: !checklistId,
    });

  const isSystemGeneratedMessage = React.useCallback((text = "") => {
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
  }, []);

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
  }, [comments, isSystemGeneratedMessage]);

  React.useEffect(() => {
    if (checklist?.supportingDocs && Array.isArray(checklist.supportingDocs)) {
      setSupportingDocs(checklist.supportingDocs);
    } else {
      setSupportingDocs([]);
    }
  }, [checklist, checklist?.supportingDocs]);

  React.useEffect(() => {
    if (location.state?.initialTab === "documents") {
      setActiveTab("documents");
      return;
    }

    setActiveTab("details");
  }, [id, location.state]);

  const uploadedDocumentCount = React.useMemo(() => {
    let mainDocs = 0;
    (docs || []).forEach((doc) => {
      const uploads = Array.isArray(doc.uploads) ? doc.uploads : [];
      if (uploads.length > 0) {
        mainDocs += uploads.length;
      } else if (doc.fileUrl || doc.uploadData?.fileUrl) {
        mainDocs += 1;
      }
    });

    const supportingDocumentCount = (supportingDocs || []).filter((doc) => doc.fileUrl).length;
    return mainDocs + supportingDocumentCount;
  }, [docs, supportingDocs]);

  const preparedChecklist = React.useMemo(
    () => ({
      ...checklist,
      bankName: checklist?.bankName || "NCBA BANK KENYA PLC",
      bankInitials: checklist?.bankInitials || "NCBA",
      dclNo: checklist?.dclNo || "N/A",
      ibpsNo: checklist?.ibpsNo || "Not provided",
      loanType: checklist?.loanType || "N/A",
      customerNumber: checklist?.customerNumber || "N/A",
      customerName:
        checklist?.customerName || checklist?.customerNumber || "N/A",
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

  if (isLoading || isFetching) {
    return (
      <div className="creator-theme" style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="creator-theme" style={{ padding: 24 }}>
        <Empty description="Checklist not found" />
      </div>
    );
  }

  return (
    <div className="creator-theme" style={{ minHeight: "100%", background: "var(--color-bg)" }}>
      <style>{`
        .rm-completed-page-shell {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .rm-completed-page-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rm-completed-page-topbar-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rm-completed-page-back {
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid var(--color-primary-soft) !important;
          color: var(--color-primary-medium) !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .rm-completed-page-back:hover,
        .rm-completed-page-back:focus {
          background: rgba(214, 189, 152, 0.1) !important;
        }
        .rm-completed-page-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }
        .rm-completed-page-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .rm-completed-page-viewdocs {
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
        .rm-completed-page-viewdocs-count {
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
        .rm-completed-page-actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 12px 16px;
        }
        .rm-completed-page-actionbar-inner {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rm-completed-page-actionbtn.ant-btn,
        .rm-completed-page-actionbar .rm-completed-page-actionbtn.ant-btn {
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
        .rm-completed-page-actionbtn--primary.ant-btn,
        .rm-completed-page-actionbar .rm-completed-page-actionbtn--primary.ant-btn,
        .rm-completed-page-actionbar .rm-completed-page-actionbtn--primary.ant-btn:hover,
        .rm-completed-page-actionbar .rm-completed-page-actionbtn--primary.ant-btn:focus {
          background: var(--ncb-primary-500) !important;
          border-color: transparent !important;
          color: #ffffff !important;
        }
        .rm-completed-page-actionbtn--secondary.ant-btn,
        .rm-completed-page-actionbar .rm-completed-page-actionbtn--secondary.ant-btn {
          background: var(--color-white) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-medium) !important;
        }
        .rm-completed-page-actionbtn--secondary.ant-btn:hover,
        .rm-completed-page-actionbtn--secondary.ant-btn:focus {
          border-color: var(--color-primary-dark) !important;
          color: var(--color-primary-dark) !important;
          background: rgba(214, 189, 152, 0.08) !important;
        }
        .rm-completed-page-layout {
          display: block;
        }
        .rm-completed-page-main {
          min-width: 0;
        }
        .rm-completed-page-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 16px;
          align-items: start;
        }
        .rm-completed-page-details-main {
          min-width: 0;
        }
        .rm-completed-page-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .rm-completed-page-tab {
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
        .rm-completed-page-tab:hover {
          color: var(--color-primary-medium);
        }
        .rm-completed-page-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }
        @media (max-width: 1023px) {
          .rm-completed-page-details-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <DocumentSidebarComponent
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      <div className="rm-completed-page-shell">
        <div className="rm-completed-page-topbar">
          <div className="rm-completed-page-topbar-main">
            <Button
              icon={<LeftOutlined />}
              className="rm-completed-page-back"
              onClick={handleClose}
            >
              Back
            </Button>
            <div>
              <h1 className="rm-completed-page-title">
                {preparedChecklist.dclNo || preparedChecklist.title || "Completed Checklist"}
              </h1>
              <div className="rm-completed-page-subtitle">
                {preparedChecklist.customerName || "Completed checklist workspace"}
              </div>
            </div>
          </div>

          <Button
            className="rm-completed-page-viewdocs"
            onClick={() => setShowDocumentSidebar(true)}
          >
            <UnorderedListOutlined />
            View Documents
            <span className="rm-completed-page-viewdocs-count">{uploadedDocumentCount}</span>
          </Button>
        </div>

        <div className="rm-completed-page-actionbar">
          <div className="rm-completed-page-actionbar-inner">
            <PDFGenerator
              checklist={preparedChecklist}
              docs={preparedDocs}
              supportingDocs={supportingDocs}
              creatorComment={checklist?.creatorComment || ""}
              comments={userComments}
              className="rm-completed-page-actionbtn rm-completed-page-actionbtn--primary"
            />
            <Button
              icon={<LeftOutlined />}
              onClick={handleClose}
              className="rm-completed-page-actionbtn rm-completed-page-actionbtn--secondary"
            >
              Back to Completed
            </Button>
          </div>
        </div>

        <div className="rm-completed-page-layout">
          <div className="rm-completed-page-main">
            <div className="rm-completed-page-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`rm-completed-page-tab ${activeTab === tab.key ? "rm-completed-page-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "details" && (
              <div className="rm-completed-page-details-layout">
                <div className="rm-completed-page-details-main">
                  <ChecklistInfoCard checklist={preparedChecklist} />
                  <DocumentSummary documentCounts={documentCounts} />
                </div>

                <CommentHistorySection
                  comments={userComments}
                  commentsLoading={commentsLoading}
                />
              </div>
            )}

            {activeTab === "documents" && (
              <div className="creator-table-shell">
                <DocumentsTable docs={docs} checklist={preparedChecklist} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedChecklistPage;
