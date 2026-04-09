// export default CommentHistory;
import React from "react";
import { Avatar, Tag, Spin, Tooltip } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { formatCommentTimestamp, normalizeBackendDate } from "../../utils/checklistUtils";
import { formatTagText, getOutlinedTagStyle, getRoleTone } from "./tagStyleUtils";
import "../../styles/creatorDesignSystem.css";

/* ---------------------------
   Role badge helper
---------------------------- */
const getRoleTag = (role) => {
  const label = formatTagText(role || "UNKNOWN").toUpperCase();

  return <Tag style={getOutlinedTagStyle(getRoleTone(role))}>{label}</Tag>;
};

/* ---------------------------
   Clean message text helper
   Removes role prefix labels (e.g., "RM Comment:", "Creator Comment:", etc.)
---------------------------- */
const cleanMessageText = (message) => {
  if (!message || typeof message !== "string") return message;
  // Remove common role prefixes like "RM Comment:", "Co-Creator Comment:", "Checker Comment:", etc.
  return message
    .replace(
      /^(RM|Co-Creator|Checker|Creator|Approver|System)\s+(Comment|Message|Note):\s*/i,
      "",
    )
    .trim();
};

/* ---------------------------
   System message detector
   (COMPREHENSIVE - removes ALL auto-generated messages)
---------------------------- */
const isSystemGeneratedMessage = (text = "") => {
  if (!text) return true;

  const message = text.toLowerCase().trim();

  // Preserve actual user comments that carry explicit author labels.
  if (
    /^(rm|co-creator|cocreator|co creator|checker|creator|approver|customer)\s+(comment|message|note):/i.test(
      text,
    )
  ) {
    return false;
  }

  // EXTENSIVE list of system-generated message patterns
  const systemPatterns = [
    // Status transitions & workflow
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

    // Auto-activity logs
    "document uploaded",
    "checklist created",
    "draft saved",
    "revived from",

    // Co-Creator workflow messages
    "submitted to co-checker",
    "submitted to co",
    "submitted to rm",
    "checklist updated",
    "documents updated",

    // RM workflow messages
    "submitted back to co-creator",
    "returned to co-creator",

    // Checker workflow messages
    "sent for approval",
    "approved checklist",
    "rejected checklist",

    // Supporting docs
    "supporting document",
    "document reference",
    "file uploaded",

    // Status change patterns
    "status changed",
    "status: ",
    "checklist status",
    "has been",
  ];

  // If message matches any system pattern, it's auto-generated
  return systemPatterns.some((pattern) => message.includes(pattern));
};

/* ---------------------------
   Component
---------------------------- */
const CommentHistory = ({ comments = [], isLoading }) => {
  // Debug logging
  React.useEffect(() => {
    console.log("📝 CommentHistory - Raw comments received:", comments);
    console.log("📝 CommentHistory - Is Loading:", isLoading);
    if (comments && comments.length > 0) {
      comments.forEach((c, idx) => {
        console.log(
          `   [${idx}] Message: "${c.message || c.comment}" | Role: ${c.userId?.role || c.role} | ID: ${c._id || c.id}`,
        );
      });
    }
  }, [comments, isLoading]);

  if (isLoading) {
    return (
      <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  /* ---------------------------
     FINAL FILTER LOGIC
     Only REAL human comments survive
  ---------------------------- */
  const filteredComments = comments.filter((item) => {
    const role = (item.userId?.role || item.role || "").toLowerCase();
    const message = item.message || item.comment || "";
    const isSystem = isSystemGeneratedMessage(message);
    const isEmpty = !message.trim();

    // Debug each comment
    if (!isSystem && !isEmpty && role !== "system") {
      console.log(`   ✅ KEEPING: "${message.substring(0, 50)}..." (${role})`);
    } else if (isSystem) {
      console.log(`   ❌ FILTERING (SYSTEM): "${message.substring(0, 50)}..."`);
    } else if (isEmpty) {
      console.log(`   ❌ FILTERING (EMPTY)`);
    } else if (role === "system") {
      console.log(`   ❌ FILTERING (SYSTEM ROLE)`);
    }

    // 1. Remove system role completely
    if (role === "system") return false;

    // 2. Remove auto-generated workflow/status messages
    if (isSystem) return false;

    // 3. Remove empty / whitespace-only comments
    if (isEmpty) return false;

    return true;
  });

  /* ---------------------------
     SORT COMMENTS BY TIMESTAMP
     Newest first (descending order)
  ---------------------------- */
  const sortedComments = [...filteredComments].sort((a, b) => {
    const timeA = normalizeBackendDate(a.createdAt || a.timestamp)?.getTime() || 0;
    const timeB = normalizeBackendDate(b.createdAt || b.timestamp)?.getTime() || 0;
    return timeB - timeA; // Newest first
  });

  if (sortedComments.length === 0) {
    return (
      <div style={{ padding: 12, fontSize: 12, color: "var(--color-text-light)" }}>
        No user comments yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--color-text-medium)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Comment Trail ({sortedComments.length})
      </div>

      {/* Comments */}
      {sortedComments.map((item, index) => (
        <div
          key={item._id || index}
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            alignItems: "flex-start",
            gap: 10,
            fontSize: 12,
            color: "var(--color-text-medium)",
            padding: 12,
            borderRadius: 8,
            background: "var(--color-white)",
            border: "1px solid rgba(214, 189, 152, 0.2)",
            minWidth: 0,
          }}
        >
          {/* Avatar */}
          <Avatar
            size={20}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#40534C", flexShrink: 0 }}
          />

          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--color-text-dark)",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.userId?.name ||
                  (typeof item.user === "object" ? item.user?.name : item.user) ||
                  "Unknown"}
              </span>

              <div style={{ flexShrink: 0 }}>
                {getRoleTag(item.userId?.role || item.role)}
              </div>
            </div>

            <Tooltip
              placement="topLeft"
              title={cleanMessageText(item.message || item.comment)}
            >
              <div
                style={{
                  color: "var(--color-text-medium)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "normal",
                  minWidth: 0,
                  maxWidth: "100%",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  cursor: "default",
                  wordBreak: "break-word",
                }}
              >
                {cleanMessageText(item.message || item.comment)}
              </div>
            </Tooltip>
          </div>

          {/* Time - Show both created and updated timestamps */}
          <span
            style={{
              fontSize: 9,
              color: "var(--color-text-light)",
              flexShrink: 0,
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ lineHeight: "1.3" }}>
              {formatCommentTimestamp(item.createdAt || item.timestamp)}
            </div>
            {item.updatedAt && item.updatedAt !== item.createdAt && (
              <div
                style={{ fontSize: 8, color: "var(--color-text-light)", lineHeight: "1.3" }}
              >
                Updated: {formatCommentTimestamp(item.updatedAt)}
              </div>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CommentHistory;
