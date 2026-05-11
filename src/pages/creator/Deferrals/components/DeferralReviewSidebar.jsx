import React from "react";
import { Spin } from "antd";
import dayjs from "dayjs";

const formatTimestamp = (value) => {
  if (!value) return "";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD MMM YYYY HH:mm");
};

const DeferralReviewSidebar = ({
  isPostingComment,
  history,
}) => {
  const recentComments = Array.isArray(history) ? [...history].reverse() : [];

  return (
    <aside className="deferral-review-sidebar">
      <div className="deferral-review-sidebar__section">
        <div className="deferral-review-sidebar__title">Recent Comments</div>
        {isPostingComment ? (
          <div className="deferral-review-sidebar__empty">
            <Spin size="small" />
          </div>
        ) : recentComments.length === 0 ? (
          <div className="deferral-review-sidebar__empty">No user comments yet.</div>
        ) : (
          <div className="deferral-review-sidebar__history">
            {recentComments.map((item, index) => (
              <div key={`${item.date || item.createdAt || "comment"}-${index}`} className="deferral-review-sidebar__history-item">
                <div className="deferral-review-sidebar__history-meta">
                  <span className="deferral-review-sidebar__history-user">{item.user || item.userName || "User"}</span>
                  <span className="deferral-review-sidebar__history-time">{formatTimestamp(item.date || item.createdAt || item.timestamp)}</span>
                </div>
                <div className="deferral-review-sidebar__history-text">
                  {item.comment || item.notes || item.message || item.text || "No comment provided."}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default DeferralReviewSidebar;
