import React from "react";
import { List, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import UniformTag from "../../../../components/common/UniformTag";
import { formatUsername } from "../utils/helpers";
import { PRIMARY_BLUE } from "../utils/constants";
import { formatCommentTimestamp, normalizeBackendDate } from "../../../../utils/checklistUtils";

/**
 * CommentTrail Component
 * Displays historical comments and approvals in a timeline format
 * Groups system messages and user comments together
 */
const CommentTrail = ({ history, isLoading }) => {
  if (isLoading) return <Spin className="block m-5" />;
  if (!history || history.length === 0)
    return <i className="pl-4">No historical comments yet.</i>;

  // Helper to check if a message is system-generated
  const isSystemMessage = (text, name, role) => {
    const textLower = text.toLowerCase();
    const nameLower = name.toLowerCase();
    const roleLower = role?.toLowerCase() || "";

    return (
      textLower.includes("submitted") ||
      textLower.includes("approved") ||
      textLower.includes("returned") ||
      textLower.includes("rejected") ||
      nameLower === "system" ||
      roleLower === "system" ||
      (textLower.includes("deferral") && textLower.includes("request"))
    );
  };

  // Group comments by timestamp + user to merge them
  const groupMap = new Map();

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const roleLabel = item.userRole || item.role;
    const name = item.user || "System";
    const text = item.comment || item.notes || item.message || item.text || "No comment provided.";
    const timestamp = item.date || item.createdAt || item.timestamp;

    const timestampKey = timestamp
      ? (normalizeBackendDate(timestamp)?.toISOString().split(".")[0] || "no-time")
      : "no-time";
    const groupKey = `${timestampKey}|${name}|${roleLabel || "unknown"}`;

    const isSystem = isSystemMessage(text, name, roleLabel);

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        name,
        roleLabel,
        systemMessages: [],
        userMessages: [],
        timestamp,
      });
    }

    const group = groupMap.get(groupKey);
    if (isSystem) {
      group.systemMessages.push(text);
    } else {
      group.userMessages.push(text);
    }
  }

  // Convert groups to display format
  const processedComments = Array.from(groupMap.values()).map((group) => ({
    name: formatUsername(group.name),
    roleLabel: group.roleLabel,
    systemText: group.systemMessages.join("; "),
    userText: group.userMessages.join("; "),
    timestamp: group.timestamp,
    merged: group.systemMessages.length > 0 && group.userMessages.length > 0,
  }));

  const getRoleTag = (role) => {
    let color = "blue";
    const roleLower = (role || "").toLowerCase();
    
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

  return (
    <div className="max-h-52 overflow-y-auto">
      <List
        dataSource={processedComments}
        itemLayout="horizontal"
        style={{ padding: 0, margin: 0 }}
        renderItem={(item, idx) => (
          <List.Item key={idx} style={{ padding: "6px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
                gap: 12,
              }}
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
                  style={{ backgroundColor: PRIMARY_BLUE, flexShrink: 0 }}
                  size={32}
                />
                <b
                  style={{
                    fontSize: 13,
                    color: PRIMARY_BLUE,
                    minWidth: "80px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flexShrink: 0,
                  }}
                >
                  {item.name}
                </b>
                {item.roleLabel && getRoleTag(item.roleLabel)}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    minWidth: 0,
                    flex: 1,
                  }}
                  title={`${item.systemText}${item.merged ? "; " + item.userText : item.userText ? item.userText : ""}`}
                >
                  <span
                    style={{
                      color: "#4a4a4a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {item.systemText}
                  </span>
                  {item.merged && (
                    <>
                      <span
                        style={{
                          margin: "0 2px",
                          color: "#999",
                          flexShrink: 0,
                        }}
                      >
                        ;
                      </span>
                      <span
                        style={{
                          color: "#4a4a4a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {item.userText}
                      </span>
                    </>
                  )}
                  {!item.merged && item.userText && (
                    <span
                      style={{
                        color: "#4a4a4a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {item.userText}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {item.timestamp
                  ? formatCommentTimestamp(item.timestamp)
                  : ""}
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default CommentTrail;
