import React from "react";
import { Spin, Tooltip } from "antd";
import { formatUsername } from "../utils/deferralHelpers";
import { formatCommentTimestamp } from "../../../../utils/checklistUtils";

/**
 * CommentTrail Component
 * Displays historical comments/notes in a scrollable list format
 *
 * Props:
 *   - history: Array of comment objects
 *   - isLoading: Boolean indicating if data is loading
 */
const CommentTrail = ({ history, isLoading }) => {
  if (isLoading) return <Spin className="block m-5" />;
  if (!history || history.length === 0) {
    return <div className="deferral-commenttrail__empty">No historical comments yet.</div>;
  }

  return (
    <div className="deferral-commenttrail">
      <div className="deferral-commenttrail__header">
        <span>Actor</span>
        <span>Role</span>
        <span>Comment</span>
        <span>Time</span>
      </div>

      <div className="deferral-commenttrail__body">
        {history.map((item, idx) => {
          const roleLabel = item.userRole || item.role || "System";
          const name = formatUsername(item.user) || item.userName || "System";
          const text =
            item.comment ||
            item.notes ||
            item.message ||
            item.text ||
            "No comment provided.";
          const timestamp = item.date || item.createdAt || item.timestamp;
          const formattedTime = formatCommentTimestamp(timestamp);

          return (
            <div key={idx} className="deferral-commenttrail__row">
              <div className="deferral-commenttrail__actor">{name}</div>
              <div className="deferral-commenttrail__role">{String(roleLabel).replace(/_/g, " ")}</div>
              <Tooltip title={text} overlayStyle={{ maxWidth: 480 }}>
                <div className="deferral-commenttrail__comment">{text}</div>
              </Tooltip>
              <div className="deferral-commenttrail__time">{formattedTime}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentTrail;
