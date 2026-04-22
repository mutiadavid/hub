import React from "react";
import { Button, Empty, Spin, message } from "antd";
import {
  LeftOutlined,
  RedoOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";

import {
  useGetChecklistCommentsQuery,
  useGetCoCreatorChecklistByIdQuery,
  useReviveChecklistMutation,
} from "../../../api/checklistApi";
import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
import { useReviveChecklist } from "./hooks/useReviveChecklist";
import ChecklistInfoCard from "./ChecklistInfoCard";
import ProgressStatsSection from "./ProgressStatsSection";
import DocumentsTable from "./DocumentsTable";
import CommentHistorySection from "./CommentHistorySection";
import DocumentSidebarComponent from "../CompletedChecklistModalComponents/DocumentSidebarComponent";
import PDFGenerator from "./PDFGenerator";
import ReviveConfirmationModal from "./ReviveConfirmationModal";
import { API_BASE_URL } from "../../../config/runtimeConfig";
import "../../../styles/creatorDesignSystem.css";

const CreatorCompletedChecklistPage = ({
  checklistId: checklistIdProp,
  initialChecklist = null,
  onClose,
}) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const id = checklistIdProp || routeId;
  const handleClose = onClose || (() => navigate(-1));

  const [activeTab, setActiveTab] = React.useState("documents");
  const [showDocumentSidebar, setShowDocumentSidebar] = React.useState(false);
  const [supportingDocs, setSupportingDocs] = React.useState([]);

  const {
    data: fetchedChecklist,
    isLoading,
    isFetching,
    refetch,
  } = useGetCoCreatorChecklistByIdQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const checklist = fetchedChecklist || initialChecklist;
  const checklistId = checklist?.id || checklist?._id;
  const { docs } = useChecklistDocuments(checklist);
  const safeDocs = React.useMemo(() => (Array.isArray(docs) ? docs : []), [docs]);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklistId, {
      skip: !checklistId,
    });

  const [reviveChecklistMutation] = useReviveChecklistMutation();

  const handleRevive = React.useCallback(
    async (checklistToRevive) => {
      const response = await reviveChecklistMutation(checklistToRevive).unwrap();

      const newDCLNumber =
        response.newDCLNumber ||
        response.checklist?.dclNo ||
        response.data?.newDCL ||
        response.dclNo;

      message.success({
        content:
          response?.message ||
          `Checklist revived successfully as ${newDCLNumber}!`,
        key: "revive",
        duration: 3,
      });

      return response;
    },
    [reviveChecklistMutation],
  );

  const {
    isReviving,
    showReviveConfirm,
    handleReviveChecklist,
    handleConfirmRevive,
    handleCancelRevive,
  } = useReviveChecklist(
    checklist,
    handleRevive,
    () => {
      refetch();
    },
    () => {
      handleClose();
    },
  );

  React.useEffect(() => {
    if (!checklistId) {
      return;
    }

    const fetchSupportingDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/uploads/checklist/${checklistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          setSupportingDocs([]);
          return;
        }

        const result = await response.json();
        const docsWithCategory = Array.isArray(result.data)
          ? result.data.map((doc) => ({
              ...doc,
              category: "Supporting Documents",
              isSupporting: true,
            }))
          : [];

        setSupportingDocs(docsWithCategory);
      } catch (error) {
        console.error("Failed to fetch supporting docs:", error);
        setSupportingDocs([]);
      }
    };

    fetchSupportingDocs();
  }, [checklistId]);

  React.useEffect(() => {
    setActiveTab("documents");
    setShowDocumentSidebar(false);
  }, [id]);

  const uploadedDocumentCount = React.useMemo(() => {
    const mainDocs = safeDocs.filter(
      (doc) => doc.fileUrl || doc.uploadData?.fileUrl,
    ).length;

    return mainDocs + supportingDocs.length;
  }, [safeDocs, supportingDocs]);

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
    }),
    [checklist],
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
        .creator-completed-page-shell {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .creator-completed-page-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .creator-completed-page-topbar-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .creator-completed-page-back {
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid var(--color-primary-soft) !important;
          color: var(--color-primary-medium) !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .creator-completed-page-back:hover,
        .creator-completed-page-back:focus {
          background: rgba(214, 189, 152, 0.1) !important;
        }
        .creator-completed-page-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }
        .creator-completed-page-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .creator-completed-page-viewdocs {
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
        .creator-completed-page-viewdocs-count {
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
        .creator-completed-page-actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 12px 16px;
        }
        .creator-completed-page-actionrow {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .creator-completed-page-button.ant-btn,
        .creator-completed-page-button.ant-btn:hover,
        .creator-completed-page-button.ant-btn:focus,
        .creator-completed-page-button.ant-btn:active {
          min-height: 34px !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          background: var(--ncb-primary-500) !important;
          border: none !important;
          color: #FFFFFF !important;
          box-shadow: none !important;
        }
        .creator-completed-page-button--secondary.ant-btn,
        .creator-completed-page-button--secondary.ant-btn:hover,
        .creator-completed-page-button--secondary.ant-btn:focus,
        .creator-completed-page-button--secondary.ant-btn:active {
          background: transparent !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-medium) !important;
        }
        .creator-completed-page-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .creator-completed-page-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 16px;
          align-items: start;
        }
        .creator-completed-page-details-main {
          min-width: 0;
        }
        .creator-completed-page-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .creator-completed-page-tab {
          padding: 6px 12px;
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
        .creator-completed-page-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }
        .creator-completed-page-tab:hover {
          color: var(--color-primary-medium);
        }
        @media (max-width: 1023px) {
          .creator-completed-page-details-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <DocumentSidebarComponent
        documents={safeDocs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      <div className="creator-completed-page-shell">
        <div className="creator-completed-page-topbar">
          <div className="creator-completed-page-topbar-main">
            <Button
              icon={<LeftOutlined />}
              className="creator-completed-page-back"
              onClick={handleClose}
            >
              Back
            </Button>
            <div>
              <h1 className="creator-completed-page-title">
                {checklist.dclNo || checklist.title || "Completed Checklist"}
              </h1>
              <div className="creator-completed-page-subtitle">
                {checklist.customerName || checklist.title || "Checklist workspace"}
              </div>
            </div>
          </div>

          <Button
            className="creator-completed-page-viewdocs"
            onClick={() => setShowDocumentSidebar(true)}
          >
            <UnorderedListOutlined />
            View Documents
            <span className="creator-completed-page-viewdocs-count">
              {uploadedDocumentCount}
            </span>
          </Button>
        </div>

        <div className="creator-completed-page-actionbar">
          <div className="creator-completed-page-actionrow">
            <Button
              className="creator-completed-page-button creator-completed-page-button--secondary"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              className="creator-completed-page-button"
              icon={<RedoOutlined />}
              loading={isReviving}
              onClick={handleReviveChecklist}
            >
              Revive Checklist
            </Button>
            <PDFGenerator
              checklist={preparedChecklist}
              docs={safeDocs}
              supportingDocs={supportingDocs}
              creatorComment={checklist?.creatorComment || ""}
              comments={comments || []}
            />
          </div>
        </div>

        <div className="creator-completed-page-layout">
          <div className="creator-completed-page-tabs">
            <button
              type="button"
              className={`creator-completed-page-tab ${activeTab === "details" ? "creator-completed-page-tab--active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              Checklist Details
            </button>
            <button
              type="button"
              className={`creator-completed-page-tab ${activeTab === "documents" ? "creator-completed-page-tab--active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              Required Documents
            </button>
          </div>

          {activeTab === "details" && (
            <div className="creator-completed-page-details-layout">
              <div className="creator-completed-page-details-main">
                <ChecklistInfoCard checklist={checklist} />
                <ProgressStatsSection docs={safeDocs} />
              </div>
              <CommentHistorySection
                comments={comments}
                isLoading={commentsLoading}
              />
            </div>
          )}

          {activeTab === "documents" && (
            <DocumentsTable docs={safeDocs} checklist={checklist} />
          )}
        </div>
      </div>

      <ReviveConfirmationModal
        open={showReviveConfirm}
        onCancel={handleCancelRevive}
        onConfirm={handleConfirmRevive}
        loading={isReviving}
      />
    </div>
  );
};

export default CreatorCompletedChecklistPage;