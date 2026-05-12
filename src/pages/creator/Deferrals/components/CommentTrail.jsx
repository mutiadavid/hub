import React from "react";
import { Tooltip, Spin } from "antd";
import { formatUsername } from "../utils/deferralHelpers";
import { formatCommentTimestamp } from "../../../../utils/checklistUtils";

const CommentTrail = ({ history, isLoading }) => {
  if (isLoading) return <div className="flex justify-center items-center py-5"><Spin /></div>;
  if (!history || history.length === 0) {
    return <div className="p-4 text-gray-400 text-xs italic text-center">No historical comments yet.</div>;
  }

  const truncateText = (text, maxLength = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="border border-[rgba(214,189,152,0.2)] rounded-lg overflow-hidden bg-white">
      {/* Header - Better column distribution */}
      <div className="grid grid-cols-[120px_100px_1fr_140px] gap-3 p-3 bg-gray-50 border-b border-[rgba(214,189,152,0.2)]">
        <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide">Actor</span>
        <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide">Role</span>
        <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide">Comment</span>
        <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide">Time</span>
      </div>

      {/* Body - Improved spacing */}
      <div className="divide-y divide-[rgba(214,189,152,0.1)]">
        {history.map((item, idx) => {
          const roleLabel = item.userRole || item.role || "System";
          // Keep full role but truncate if too long
          const fullRole = String(roleLabel).replace(/_/g, " ");
          const displayRole = fullRole.length > 15 ? fullRole.substring(0, 12) + "..." : fullRole;
          const name = formatUsername(item.user) || item.userName || "System";
          const displayName = name.length > 18 ? name.substring(0, 15) + "..." : name;
          const text = item.comment || item.notes || item.message || item.text || "No comment provided.";
          const timestamp = item.date || item.createdAt || item.timestamp;
          const formattedTime = formatCommentTimestamp(timestamp);
          const truncatedComment = truncateText(text, 100);

          return (
            <div key={idx} className="grid grid-cols-[120px_100px_1fr_140px] gap-3 p-3 text-xs font-normal hover:bg-gray-50 transition-colors">
              {/* Actor - with tooltip */}
              <Tooltip title={name}>
                <div className="text-[#164679] font-semibold truncate cursor-help">
                  {displayName}
                </div>
              </Tooltip>

              {/* Role - with tooltip */}
              <Tooltip title={fullRole}>
                <div className="text-gray-600 capitalize truncate cursor-help">
                  {displayRole}
                </div>
              </Tooltip>

              {/* Comment - with tooltip for full text */}
              <Tooltip title={text} overlayStyle={{ maxWidth: 450 }}>
                <div className="text-gray-700 break-words leading-relaxed cursor-help">
                  {truncatedComment}
                </div>
              </Tooltip>

              {/* Time - No truncation */}
              <div className="text-gray-400 text-[11px] whitespace-nowrap">
                {formattedTime}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentTrail;