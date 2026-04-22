/**
 * Actioned Module - Comment Trail Component
 * Displays historical comments and activity
 */

import React from "react";
import { List, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import "../../../../styles/creatorDesignSystem.css";
import { formatUsername } from "../utils";
import UniformTag from "../../../../components/common/UniformTag";
import { getRoleTone } from "../../../../components/common/tagStyleUtils";
import { formatCommentTimestamp } from "../../../../utils/checklistUtils";

/**
 * CommentTrail - Displays comment history
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Comment trail component
 */
const CommentTrail = ({ history = [], isLoading = false }) => {
  if (isLoading) {
    return <Spin className="block m-5" />;
  }

  if (!history || history.length === 0) {
    return (
      <div style={{ padding: 12, fontSize: 12, color: "var(--color-text-light)" }}>
        No historical comments yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        maxHeight: 420,
        overflowY: "auto",
        paddingRight: 2,
      }}
    >
      <List
        dataSource={history}
        itemLayout="horizontal"
        style={{ padding: 0, margin: 0 }}
        renderItem={(item, idx) => {
          const roleLabel = item.userRole || item.role;
          const name = formatUsername(item.user || "System");
          const text =
            item.comment ||
            item.notes ||
            item.message ||
            item.text ||
            "No comment provided.";
          const timestamp = item.date || item.createdAt || item.timestamp;

          return (
            <List.Item key={idx} style={{ padding: "3px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: "var(--color-white)",
                  border: "1px solid rgba(214, 189, 152, 0.24)",
                  boxShadow: "0 10px 25px rgba(64, 83, 76, 0.06)",
                }}
                title={`${name}: ${text}`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#40534C", flexShrink: 0 }}
                    size={24}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-dark)",
                          fontWeight: 400,
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {name}
                      </span>
                      {roleLabel && (
                        <div style={{ flex: "0 0 auto" }}>
                          <UniformTag
                            color={getRoleTone(roleLabel)}
                            text={roleLabel}
                            uppercase
                            maxChars={14}
                          />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-text-dark)", lineHeight: 1.4 }}>
                      {text}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: "var(--color-text-dark)", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {timestamp ? formatCommentTimestamp(timestamp) : "No date"}
                </span>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default CommentTrail;
