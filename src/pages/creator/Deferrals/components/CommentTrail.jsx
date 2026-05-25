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
    <div className="border border-[rgba(214,189,152,0.2)] rounded-lg bg-white overflow-hidden flex flex-col">
      <div className="border-b border-[rgba(214,189,152,0.2)] bg-gray-50">
        {/* Header - Natural column distribution */}
        <div className="grid grid-cols-[80px_70px_1fr_115px] gap-2 px-4 py-3">
          <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Actor</span>
          <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Role</span>
          <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Comment</span>
          <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide text-right">Time</span>
        </div>
      </div>

      {/* Body - Natural flow without scrollbars */}
      <div className="divide-y divide-[rgba(214,189,152,0.1)]">
        {history.map((item, idx) => {
          const roleLabel = item.userRole || item.role || "System";
          // Keep full role but truncate if too long
          const fullRole = String(roleLabel).replace(/_/g, " ");
          const displayRole = fullRole.length > 12 ? fullRole.substring(0, 10) + "..." : fullRole;
          const name = formatUsername(item.user) || item.userName || "System";
          const displayName = name.length > 15 ? name.substring(0, 12) + "..." : name;
          const text = item.comment || item.notes || item.message || item.text || "No comment provided.";
          const timestamp = item.date || item.createdAt || item.timestamp;
          const formattedTime = formatCommentTimestamp(timestamp);
          
          // Use CSS to truncate the comment to one line with ellipsis, Tooltip handles hover
          const truncatedComment = text;

          return (
            <div key={idx} className="grid grid-cols-[80px_70px_1fr_115px] gap-2 px-4 py-3 text-[11px] font-normal hover:bg-gray-50 transition-colors items-center">
                {/* Actor - with tooltip */}
                <Tooltip title={name}>
                  <div className="text-[#164679] font-semibold truncate cursor-help mt-[1px]">
                    {displayName}
                  </div>
                </Tooltip>

                {/* Role - with tooltip */}
                <Tooltip title={fullRole}>
                  <div className="text-gray-600 capitalize truncate cursor-help mt-[1px]">
                    {displayRole}
                  </div>
                </Tooltip>

                {/* Comment - with tooltip for full text */}
                <Tooltip title={text} overlayStyle={{ maxWidth: 450 }}>
                  <div className="text-gray-700 truncate cursor-help pr-1">
                    {text}
                  </div>
                </Tooltip>

                {/* Time - No truncation */}
                <div className="text-gray-400 text-[10px] whitespace-nowrap text-right mt-[2px]">
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