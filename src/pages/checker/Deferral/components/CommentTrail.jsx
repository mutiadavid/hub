import React from "react";
import { Empty, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "../../../../styles/creatorDesignSystem.css";

const formatTimestamp = (value) => {
  if (!value) return "Unknown time";

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return String(value);
  }

  return parsed.format("DD MMM YYYY HH:mm:ss");
};

const getRoleTone = (role) => {
  const normalizedRole = String(role || "comment").trim().toUpperCase();

  if (normalizedRole.includes("COCHECKER")) {
    return {
      border: "#f59e72",
      text: "#c2410c",
      background: "#fff7ed",
    };
  }

  if (normalizedRole.includes("COCREATOR")) {
    return {
      border: "#86d3ab",
      text: "#166534",
      background: "#f0fdf4",
    };
  }

  if (normalizedRole.includes("RM")) {
    return {
      border: "#93c5fd",
      text: "#1d4ed8",
      background: "#eff6ff",
    };
  }

  return {
    border: "rgba(214, 189, 152, 0.45)",
    text: "#40534c",
    background: "#faf7f2",
  };
};

const sortCommentsNewestFirst = (comments) => {
  return [...comments].sort((left, right) => {
    const leftTime = dayjs(left.createdAt || left.timestamp).valueOf() || 0;
    const rightTime = dayjs(right.createdAt || right.timestamp).valueOf() || 0;
    return rightTime - leftTime;
  });
};

const CommentTrail = ({ comments = [], isLoading = false }) => {
  const sortedComments = sortCommentsNewestFirst(comments);

  if (isLoading) {
    return (
      <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (!sortedComments.length) {
    return (
      <div className="checker-comment-trail checker-comment-trail--empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No comments available"
        />
      </div>
    );
  }

  return (
    <div
      className="checker-comment-trail"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          color: "#40534c",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Comment Trail ({sortedComments.length})
      </div>

      {sortedComments.map((comment, index) => {
        const roleLabel = comment.role || comment.action || "Comment";
        const roleTone = getRoleTone(roleLabel);
        const authorName = comment.name || comment.author || "Unknown User";
        const messageText =
          comment.commentText || comment.message || comment.comment || "No content";

        return (
          <div
            key={comment.id || index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(214, 189, 152, 0.24)",
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(26, 54, 54, 0.04)",
            }}
          >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#40534c",
                  color: "#ffffff",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
              <UserOutlined style={{ fontSize: 12 }} />
            </span>

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      color: "#102a43",
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      flexShrink: 0,
                    }}
                  >
                    {authorName}
                  </span>

                  <span
                    title={roleLabel}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 24,
                      maxWidth: "100%",
                      padding: "0 10px",
                      borderRadius: 999,
                      border: `1px solid ${roleTone.border}`,
                      background: roleTone.background,
                      color: roleTone.text,
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flexShrink: 1,
                    }}
                  >
                    {roleLabel}
                  </span>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 11,
                      lineHeight: 1.35,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      marginLeft: "auto",
                    }}
                  >
                    {formatTimestamp(comment.createdAt || comment.timestamp)}
                  </span>
                </div>

                <div
                  style={{
                    color: "#334e68",
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {messageText}
                </div>
              </div>
          </div>
        );
      })}
    </div>
  );
};


export default CommentTrail;
