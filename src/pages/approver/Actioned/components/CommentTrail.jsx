/**
 * Actioned Module - Comment Trail Component
 * Displays historical comments and activity
 */

import React from "react";
import { List, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
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
      <div className="p-3 text-xs text-(--color-text-light)">
        No historical comments yet.
      </div>
    );
  }

  return (
    <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-0.5">
      <List
        dataSource={history}
        itemLayout="horizontal"
        className="m-0 p-0"
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
            <List.Item key={idx} className="py-[3px]">
              <div
                className="flex w-full items-start justify-between gap-2.5 rounded-xl border border-[rgba(214,189,152,0.24)] bg-white p-2.5 shadow-[0_10px_25px_rgba(64,83,76,0.06)]"
                title={`${name}: ${text}`}
              >
                <div
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <Avatar
                    icon={<UserOutlined />}
                    className="shrink-0 bg-[#40534C]"
                    size={24}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span
                        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal text-(--color-text-dark)"
                      >
                        {name}
                      </span>
                      {roleLabel && (
                        <div className="shrink-0">
                          <UniformTag
                            color={getRoleTone(roleLabel)}
                            text={roleLabel}
                            uppercase
                            maxChars={14}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs leading-[1.4] text-(--color-text-dark)">
                      {text}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[10px] text-(--color-text-dark)">
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
