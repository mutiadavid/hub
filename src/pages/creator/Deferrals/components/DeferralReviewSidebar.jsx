import React from "react";
import CommentTrail from "./CommentTrail";

/**
 * DeferralReviewSidebar Component - Comments only
 */
const DeferralReviewSidebar = ({
  history,
  isLoadingHistory,
  comments,
  commentsLoading,
}) => {
  return (
    <div className="bg-white border border-[rgba(214,189,152,0.2)] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[rgba(214,189,152,0.2)]">
        <div className="text-xs font-semibold tracking-wide uppercase text-gray-500">
          Comments
        </div>
      </div>

      {/* Body - No scrollbar, natural flow */}
      <div className="p-3">
        <div className="text-xs font-medium text-gray-600 mb-2">
          Comment Trail & History
        </div>
        <CommentTrail history={history || comments} isLoading={isLoadingHistory || commentsLoading} />
      </div>
    </div>
  );
};

export default DeferralReviewSidebar;