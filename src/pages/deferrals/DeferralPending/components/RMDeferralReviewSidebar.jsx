import React from "react";
import dayjs from "dayjs";
import UniformTag from "../../../../components/common/UniformTag";

const formatTimestamp = (value) => {
  if (!value) return "";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD MMM YYYY HH:mm");
};

const getRoleTag = (role) => {
  const roleLower = String(role || "").toLowerCase();

  if (!roleLower) {
    return null;
  }

  let color = "blue";

  switch (roleLower) {
    case "rm":
      color = "blue";
      break;
    case "deferral management":
      color = "green";
      break;
    case "creator":
    case "cocreator":
    case "co creator":
    case "co_creator":
      color = "green";
      break;
    case "checker":
    case "cochecker":
    case "co checker":
    case "co_checker":
      color = "volcano";
      break;
    case "system":
      color = "default";
      break;
    default:
      color = "blue";
  }

  return (
    <UniformTag
      color={color}
      text={roleLower.replace(/_/g, " ")}
      uppercase
      maxChars={14}
      style={{ marginLeft: 8 }}
    />
  );
};

const RMDeferralReviewSidebar = ({ history }) => {
  return (
    <aside className="deferral-review-sidebar">
      <div className="deferral-review-sidebar__section">
        <div className="deferral-review-sidebar__history-title">Recent Comments</div>
        {history.length === 0 ? (
          <div className="deferral-review-sidebar__empty">No user comments yet.</div>
        ) : (
          <div className="deferral-review-sidebar__history">
            {[...history].reverse().slice(0, 6).map((item, index) => (
              <div key={`${item.date || item.createdAt || "comment"}-${index}`} className="deferral-review-sidebar__history-item">
                <div className="deferral-review-sidebar__history-meta">
                  <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                    <span className="deferral-review-sidebar__history-user">{item.user || item.userName || "User"}</span>
                    {getRoleTag(item.userRole || item.role)}
                  </div>
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

export default RMDeferralReviewSidebar;