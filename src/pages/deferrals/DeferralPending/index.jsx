import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useGetApproversQuery } from "../../../api/userApi";
import deferralApi from "../../../service/deferralApi";
import { getDeferralDocumentBuckets } from "../../../utils/deferralDocuments";
import { showErrorToast, showSuccessToast } from "../../../utils/authToast";

// Hooks
import { useDeferralData } from "./hooks/useDeferralData";
import { useDeferralFiltering } from "./hooks/useDeferralFiltering";
import { useDeferralModal } from "./hooks/useDeferralModal";
import { useExtensionModal } from "./hooks/useExtensionModal";

// Components
import DeferralTableSection from "./components/DeferralTable";
import DeferralDetailsModal from "./components/DeferralDetailsModal";
import ExtensionApplicationModal from "./components/ExtensionApplicationModal";
import ExtensionReturnForReworkModal from "./components/ExtensionReturnForReworkModal";

// Styles
import { getDeferralCustomStyles, getTableCustomStyles } from "./styles/deferralPendingStyles";
import "../../../styles/creatorDesignSystem.css";

/**
 * Main DeferralPending Component for RM
 * Manages deferral requests for Relationship Managers
 * @param {string} userId - Current user ID (default: "rm_current")
 */
const DeferralPending = ({ userId = "rm_current" }) => {
  const navigate = useNavigate();

  // Initialize all custom hooks
  const { deferrals, setDeferrals, loading, loadDeferrals } = useDeferralData(userId);
  const {
    searchText,
    setSearchText,
    activeTab,
    setActiveTab,
    dataByTab,
    currentData,
  } = useDeferralFiltering(deferrals);
  const {
    selectedDeferral,
    setSelectedDeferral,
    modalOpen,
    setModalOpen,
    detailOverrides,
    setDetailOverrides,
  } = useDeferralModal();
  const extensionModal = useExtensionModal();

  // Fetch available approvers
  useGetApproversQuery();

  // Load deferrals on component mount
  useEffect(() => {
    loadDeferrals();
    window.deferralRefresh = loadDeferrals;
    return () => {
      if (window.deferralRefresh === loadDeferrals) {
        delete window.deferralRefresh;
      }
    };
  }, [loadDeferrals]);

  // Cross-tab refresh when deferrals update
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "deferral:update") {
        loadDeferrals();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadDeferrals]);

  // Listen for deferral updates
  useEffect(() => {
    const handleDeferralUpdate = (event) => {
      const updatedDeferral = event.detail;
      if (updatedDeferral) {
        setDeferrals((prev) => {
          const index = prev.findIndex((d) => d._id === updatedDeferral._id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = updatedDeferral;
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener("deferral:updated", handleDeferralUpdate);
    return () =>
      window.removeEventListener("deferral:updated", handleDeferralUpdate);
  }, [setDeferrals]);

  // Handle modal actions (e.g., extension, close, refresh)
  const handleModalAction = (payload) => {
    if (!payload) {
      loadDeferrals();
      return;
    }

    // Handle refresh deferrals (sync documents across all pages)
    if (payload.action === "refreshDeferrals") {
      loadDeferrals();
      return;
    }

    if (payload.action === "extensionSubmitted") {
      const updatedDeferral = payload.updatedDeferral;

      if (updatedDeferral && (updatedDeferral._id || updatedDeferral.id)) {
        setDeferrals((prev) => prev.map((item) => {
          const itemId = item._id || item.id;
          const updatedId = updatedDeferral._id || updatedDeferral.id;
          return itemId === updatedId ? { ...item, ...updatedDeferral } : item;
        }));
        setSelectedDeferral(updatedDeferral);
      }

      loadDeferrals();
      try {
        window.dispatchEvent(new CustomEvent("extension:created", { detail: payload.extension }));
        window.dispatchEvent(new CustomEvent("deferral:updated", { detail: updatedDeferral }));
      } catch {
        // ignore event dispatch failures
      }
      return;
    }

    if (payload.action === "viewExtensionApplications") {
      setActiveTab("extensions");
      return;
    }

    if (payload.action === "resubmitDeferralCompleted") {
      const updatedDeferral = payload.updatedDeferral;

      if (updatedDeferral && (updatedDeferral._id || updatedDeferral.id)) {
        setDeferrals((prev) => prev.map((item) => {
          const itemId = item._id || item.id;
          const updatedId = updatedDeferral._id || updatedDeferral.id;
          return itemId === updatedId ? { ...item, ...updatedDeferral } : item;
        }));
      }

      setActiveTab("pending");
      setModalOpen(false);
      setSelectedDeferral(null);
      setDetailOverrides(null);
      extensionModal.resetExtensionState();
      loadDeferrals();
      return;
    }

    // Handle extension application
    if (payload.action === "apply_extension" && payload.deferral) {
      const def = payload.deferral;
      extensionModal.setSelectedDeferralForExtension(def);

      try {
        const { requestedDocs = [] } = getDeferralDocumentBuckets(def) || {};
        const init = {};
        requestedDocs.forEach((doc) => {
          const key = String((doc && (doc.name || doc.label)) || doc || "")
            .trim()
            .toLowerCase();
          init[key] = 0;
        });
        extensionModal.setExtensionDaysByDoc(init);
      } catch {
        extensionModal.setExtensionDaysByDoc({});
      }

      extensionModal.setExtensionModalOpen(true);
      extensionModal.setExtensionSubmissionSuccess(false);
      return;
    }

    // Handle resubmit extension (open dedicated rework modal)
    if (payload.action === "resubmitExtension" && payload.deferral) {
      const def = payload.deferral;
      extensionModal.setSelectedDeferralForExtension(def);
      extensionModal.setExtensionReworkModalOpen(true);
      return;
    }

    // Handle remind approver
    if (payload.action === "remindApprover" && payload.deferral) {
      const deferral = payload.deferral;
      const deferralId = deferral._id || deferral.id;

      (async () => {
        try {
          const token = localStorage.getItem("token");
          await deferralApi.sendReminder(deferralId, token);
          showSuccessToast("Reminder sent to approver successfully");
        } catch (error) {
          console.error("Error sending reminder:", error);
          showErrorToast(error.message || "Failed to send reminder");
        }
      })();

      return;
    }

    // Handle resubmit deferral
    if (payload.action === "resubmitDeferral" && payload.deferral) {
      const deferral = payload.deferral;
      const deferralId = deferral._id || deferral.id;

      // Navigate to the deferral request page with the deferral ID to edit and resubmit
      navigate(`/rm/deferrals/request?resubmit=${deferralId}`);
      return;
    }

    // Handle modal close
    if (payload.action === "close_deferral_modal") {
      try {
        setModalOpen(false);
        setSelectedDeferral(null);
        setDetailOverrides(null);
        extensionModal.resetExtensionState();
      } catch {
        /* ignore */
      }
      return;
    }

    // Handle deferral update
    const updatedDeferral = payload?.updatedDeferral || payload;
    if (!updatedDeferral) {
      loadDeferrals();
      return;
    }

    const updatedId = updatedDeferral._id || updatedDeferral.id;
    if (!updatedId) {
      loadDeferrals();
      return;
    }

    setDeferrals((prev) => {
      const index = prev.findIndex((d) => (d._id || d.id) === updatedId);
      if (index === -1) {
        return prev;
      }
      const next = [...prev];
      next[index] = { ...next[index], ...updatedDeferral };
      return next;
    });

    setSelectedDeferral((prev) => {
      if (!prev) return prev;
      const prevId = prev._id || prev.id;
      return prevId === updatedId ? { ...prev, ...updatedDeferral } : prev;
    });

    loadDeferrals();
  };

  // Apply styles
  const customStyles = getDeferralCustomStyles();
  const tableStyles = getTableCustomStyles();
  const showingExtensionReview =
    extensionModal.extensionModalOpen &&
    !!extensionModal.selectedDeferralForExtension;
  const showingDeferralReview =
    !showingExtensionReview && modalOpen && !!selectedDeferral;
  const showingReviewSurface = showingDeferralReview || showingExtensionReview;

  return (
    <div className="creator-queue-page creator-theme" style={{ boxSizing: "border-box" }}>
      <style>{customStyles}</style>
      <style>{tableStyles}</style>
      <style>{`
        .creator-queue-page {
          min-height: 100%;
          width: 100%;
          background: var(--color-bg);
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
        }
        .creator-queue-shell {
          width: 100%;
        }
        .creator-queue-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          overflow: hidden;
        }
        .creator-queue-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 16px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          background: var(--color-bg);
        }
        .creator-queue-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .creator-queue-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .creator-queue-title {
          color: var(--color-text-dark);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .creator-queue-subtitle {
          color: var(--color-text-light);
          font-size: 12px;
        }
        .creator-queue-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(214, 189, 152, 0.24);
          color: var(--color-text-dark);
          font-size: 10px;
          font-weight: 700;
        }
        .creator-queue-toolbar-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex: 1;
          flex-wrap: wrap;
        }
        .creator-queue-search {
          width: min(360px, 100%);
        }
        .creator-queue-search.ant-input-affix-wrapper {
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          box-shadow: none !important;
        }
        .creator-queue-search.ant-input-affix-wrapper:hover,
        .creator-queue-search.ant-input-affix-wrapper:focus,
        .creator-queue-search.ant-input-affix-wrapper-focused {
          border-color: var(--color-primary-dark) !important;
          box-shadow: none !important;
        }
        .creator-queue-search input {
          background: transparent !important;
          font-size: 12px !important;
          color: var(--color-text-medium) !important;
        }
        .creator-queue-action.ant-btn {
          height: 38px;
          border-radius: 6px !important;
          box-shadow: none !important;
          font-size: 12px;
          font-weight: 600;
        }
        .creator-queue-action--ghost.ant-btn {
          border: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
        }
        .creator-queue-action--primary.ant-btn {
          border: none !important;
          background: var(--ncb-primary-500) !important;
          color: var(--color-white) !important;
        }
        @media (max-width: 768px) {
          .creator-queue-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .creator-queue-toolbar-actions {
            justify-content: stretch;
          }
          .creator-queue-search,
          .creator-queue-action {
            width: 100%;
          }
        }
      `}</style>

      {!showingReviewSurface && (
        <div className="creator-queue-shell">
          <div className="creator-queue-card">
            <div className="creator-queue-toolbar">
              <div className="creator-queue-title-group">
                <div className="creator-queue-title-row">
                  <h2 className="creator-queue-title">My Deferral Requests</h2>
                  <span className="creator-queue-count">{currentData.length}</span>
                </div>
                <div className="creator-queue-subtitle">Track and manage your deferral requests</div>
              </div>

              <div className="creator-queue-toolbar-actions">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search by Deferral No, DCL No, Customer, Loan Type, or Document"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  className="creator-queue-search"
                />
                <Button
                  className="creator-queue-action creator-queue-action--ghost"
                  onClick={() => setSearchText("")}
                >
                  Clear Filters
                </Button>
                <Button
                  className="creator-queue-action creator-queue-action--primary"
                  onClick={() => navigate("/rm/deferrals/request")}
                  icon={<PlusOutlined />}
                >
                  New Deferral Request
                </Button>
                <Button
                  className="creator-queue-action creator-queue-action--ghost"
                  onClick={loadDeferrals}
                  loading={loading}
                  icon={<ReloadOutlined />}
                  title="Refresh deferrals list"
                >
                  Refresh
                </Button>
              </div>
            </div>

            <DeferralTableSection
              activeTab={activeTab}
              onTabChange={setActiveTab}
              pendingCount={dataByTab.pending?.length || 0}
              approvedCount={dataByTab.approved?.length || 0}
              rejectedCount={dataByTab.rejected?.length || 0}
              closeRequestsCount={dataByTab.closeRequests?.length || 0}
              extensionsCount={dataByTab.extensions?.length || 0}
              extensionReworkCount={dataByTab.extensionRework?.length || 0}
              isLoading={loading}
              currentData={currentData}
              onRowClick={async (record) => {
                try {
                  const token = localStorage.getItem("token");
                  if (token) {
                    const fullDeferral = await deferralApi.getDeferralById(record._id || record.id, token);
                    setSelectedDeferral(fullDeferral || record);
                  } else {
                    setSelectedDeferral(record);
                  }
                } catch (error) {
                  console.error("Error fetching deferral details:", error);
                  setSelectedDeferral(record);
                }
                setDetailOverrides(null);
                setModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Deferral Details Review */}
      {showingDeferralReview && selectedDeferral && (
        <DeferralDetailsModal
          deferral={selectedDeferral}
          open={modalOpen}
          embedded
          onClose={() => {
            setModalOpen(false);
            setSelectedDeferral(null);
            setDetailOverrides(null);
          }}
          onAction={handleModalAction}
          headerTag={detailOverrides?.headerTag}
          overrideDaysSought={detailOverrides?.overrideDaysSought}
          overrideNextDueDate={detailOverrides?.overrideNextDueDate}
          readOnly={detailOverrides?.readOnly}
          overrideApprovals={detailOverrides?.overrideApprovals}
          activeTab={activeTab}
        />
      )}

      {/* Extension Application Review */}
      <ExtensionApplicationModal
        key={
          extensionModal.selectedDeferralForExtension?._id ||
          extensionModal.selectedDeferralForExtension?.id ||
          "extension-review"
        }
        open={extensionModal.extensionModalOpen}
        embedded={showingExtensionReview}
        selectedDeferral={extensionModal.selectedDeferralForExtension}
        extensionDays={extensionModal.extensionDays}
        extensionDaysByDoc={extensionModal.extensionDaysByDoc}
        extensionComment={extensionModal.extensionComment}
        extensionFiles={extensionModal.extensionFiles}
        extensionSubmitting={extensionModal.extensionSubmitting}
        extensionSubmissionSuccess={extensionModal.extensionSubmissionSuccess}
        onDaysChange={extensionModal.setExtensionDays}
        onDaysByDocChange={extensionModal.setExtensionDaysByDoc}
        onCommentChange={extensionModal.setExtensionComment}
        onFilesChange={extensionModal.setExtensionFiles}
        onClose={extensionModal.resetExtensionState}
        onSubmit={async () => {
          // Validate
          if (!extensionModal.extensionDaysByDoc || Object.keys(extensionModal.extensionDaysByDoc).length === 0) {
            showErrorToast("Please enter extension days for at least one document");
            return;
          }

          const hasDays = Object.values(extensionModal.extensionDaysByDoc).some(
            (days) => typeof days === "number" && days > 0,
          );
          if (!hasDays) {
            showErrorToast("Please enter valid extension days");
            return;
          }

          const exceedsMaximumExtensionDays = Object.values(extensionModal.extensionDaysByDoc).some(
            (days) => Number.isFinite(Number(days)) && Number(days) > 90,
          );
          if (exceedsMaximumExtensionDays) {
            showErrorToast("Maximum 90 extension days allowed per document");
            return;
          }

          extensionModal.setExtensionSubmitting(true);
          try {
            const stored = JSON.parse(localStorage.getItem("user") || "null");
            const token = stored?.token;
            const requestedAbsoluteValues = Object.values(extensionModal.extensionDaysByDoc)
              .map((extensionDays) => {
                const normalizedExtensionDays = Number(extensionDays);
                return Number.isFinite(normalizedExtensionDays) && normalizedExtensionDays > 0
                  ? normalizedExtensionDays
                  : null;
              })
              .filter(Boolean);

            if (requestedAbsoluteValues.length === 0) {
              showErrorToast("Please enter valid extension days");
              extensionModal.setExtensionSubmitting(false);
              return;
            }

            const extensionData = {
              requestedDaysSought: Math.max(...requestedAbsoluteValues),
              extensionDaysByDoc: extensionModal.extensionDaysByDoc,
              comment: extensionModal.extensionComment,
              fileUrls: extensionModal.extensionFiles
                .map((f) => f.url || f.response?.url || "")
                .filter((url) => typeof url === "string" && url.trim() !== ""),
            };

            await deferralApi.submitExtension(
              extensionModal.selectedDeferralForExtension._id,
              extensionData,
              token,
            );

            showSuccessToast("Extension application submitted successfully");

            // Refresh deferral data
            await loadDeferrals();

            // Dispatch update event
            if (extensionModal.selectedDeferralForExtension) {
              window.dispatchEvent(
                new CustomEvent("deferral:updated", {
                  detail: extensionModal.selectedDeferralForExtension,
                }),
              );
            }

            extensionModal.setExtensionSubmissionSuccess(true);
          } catch (error) {
            console.error("Error submitting extension:", error);
            showErrorToast(error.message || "Failed to submit extension application");
          } finally {
            extensionModal.setExtensionSubmitting(false);
          }
        }}
        onSuccessViewExtensions={() => {
          extensionModal.resetExtensionState();
          setActiveTab("extensions");
        }}
      />
      <ExtensionReturnForReworkModal
        open={extensionModal.extensionReworkModalOpen}
        deferral={extensionModal.selectedDeferralForExtension}
        onClose={() => extensionModal.setExtensionReworkModalOpen(false)}
        onUpdate={() => {
          loadDeferrals();
          setActiveTab("extensions");
        }}
      />
    </div>
  );
};

export default DeferralPending;
