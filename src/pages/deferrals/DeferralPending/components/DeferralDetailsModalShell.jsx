import React from "react";
import RMDeferralReviewActionBar from "./RMDeferralReviewActionBar";
import RMDeferralReviewDetails from "./RMDeferralReviewDetails";
import RMDeferralReviewDocuments from "./RMDeferralReviewDocuments";
import RMDeferralReviewHeader from "./RMDeferralReviewHeader";
import RMDeferralReviewSidebar from "./RMDeferralReviewSidebar";

const DeferralDetailsModalShell = ({
  embedded,
  onClose,
  displayDeferral,
  headerTag,
  documentCount,
  workspaceTab,
  setWorkspaceTab,
  history,
  detailsProps,
  documentsProps,
  actionBarProps,
}) => {
  const wrapperClassName = embedded
    ? "deferral-modal-embedded"
    : "deferral-modal-overlay";
  const wrapperStyle = embedded ? undefined : { display: "flex" };
  const wrapperClickHandler = embedded ? undefined : onClose;
  const containerClassName = embedded
    ? "deferral-modal-container deferral-modal-container--embedded deferral-review-container"
    : "deferral-modal-container deferral-review-container";

  return (
    <div
      className={wrapperClassName}
      style={wrapperStyle}
      onClick={wrapperClickHandler}
    >
      <div
        className={containerClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="deferral-review-panel">
          <RMDeferralReviewHeader
            deferral={displayDeferral}
            headerTag={headerTag}
            documentCount={documentCount}
            onClose={onClose}
            onViewDocuments={() => setWorkspaceTab("documents")}
          />

          <RMDeferralReviewActionBar {...actionBarProps} />

          <div
            className="deferral-review-body"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="deferral-review-tabs">
              <button
                type="button"
                className={`deferral-review-tab ${workspaceTab === "details" ? "deferral-review-tab--active" : ""}`}
                onClick={() => setWorkspaceTab("details")}
              >
                Details
              </button>
              <button
                type="button"
                className={`deferral-review-tab ${workspaceTab === "documents" ? "deferral-review-tab--active" : ""}`}
                onClick={() => setWorkspaceTab("documents")}
              >
                Documents
              </button>
            </div>

            <div className="deferral-review-workspace">
              <div className="deferral-review-main">
                {workspaceTab === "details" ? (
                  <RMDeferralReviewDetails {...detailsProps} />
                ) : (
                  <RMDeferralReviewDocuments {...documentsProps} />
                )}
              </div>

              <RMDeferralReviewSidebar history={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeferralDetailsModalShell;
