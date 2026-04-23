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
    return (
      <div className="p-3 text-xs text-(--color-text-light)">
        No historical comments yet.
      </div>
    );

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

    const isSystem =
      typeof item.isSystemComment === "boolean"
        ? item.isSystemComment
        : isSystemMessage(text, name, roleLabel);

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
        <span className="ml-2">
          <UniformTag
            color={color}
            text={roleLower.replace(/_/g, " ")}
            uppercase
            maxChars={14}
          />
        </span>
    );
  };

  return (
    <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-0.5">
      <List
        dataSource={processedComments}
        itemLayout="horizontal"
        className="m-0 p-0"
        renderItem={(item, idx) => (
          <List.Item key={idx} className="py-[3px]">
            <div
              className="flex w-full items-start justify-between gap-2.5 rounded-xl border border-[rgba(214,189,152,0.24)] bg-white p-2.5 shadow-[0_10px_25px_rgba(64,83,76,0.06)]"
            >
              <div
                className="flex min-w-0 flex-1 items-start gap-2.5"
              >
                <Avatar
                  icon={<UserOutlined />}
                  className="shrink-0 bg-[#40534C]"
                  size={24}
                />
                <div
                  className="flex min-w-0 flex-1 flex-col gap-1"
                  title={`${item.systemText}${item.merged ? "; " + item.userText : item.userText ? item.userText : ""}`}
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span
                      className="min-w-0 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal text-(--color-text-dark)"
                    >
                      {item.name}
                    </span>
                    {item.roleLabel && getRoleTag(item.roleLabel)}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-1">
                    <span
                      className="min-w-0 text-xs leading-[1.4] text-(--color-text-dark)"
                    >
                      {item.systemText}
                    </span>
                    {item.merged && (
                      <span
                        className="mx-0.5 shrink-0 text-(--color-text-dark)"
                      >
                        ;
                      </span>
                    )}
                    <span
                      className="min-w-0 text-xs leading-[1.4] text-(--color-text-dark)"
                    >
                      {item.merged ? item.userText : item.userText || ""}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="shrink-0 whitespace-nowrap text-[10px] text-(--color-text-dark)"
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