import React from "react";
import { Empty, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { formatCommentTimestamp } from "../../../../utils/checklistUtils";

const getRoleTone = (role) => {
  const normalizedRole = String(role || "comment").trim().toUpperCase();

  if (normalizedRole.includes("COCHECKER")) {
    return {
      badgeClassName:
        "border-[#f59e72] bg-[#fff7ed] text-[#c2410c]",
    };
  }

  if (normalizedRole.includes("COCREATOR")) {
    return {
      badgeClassName:
        "border-[#86d3ab] bg-[#f0fdf4] text-[#166534]",
    };
  }

  if (normalizedRole.includes("RM")) {
    return {
      badgeClassName:
        "border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]",
    };
  }

  return {
    badgeClassName:
      "border-[rgba(214,189,152,0.45)] bg-[#faf7f2] text-[#40534c]",
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
      <div className="flex justify-center p-4">
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
    <div className="flex flex-col gap-2.5">
      <div className="text-[11px] font-bold tracking-[0.08em] text-[#40534c] uppercase">
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
            className="flex items-start gap-3 rounded-xl border border-[rgba(214,189,152,0.24)] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(26,54,54,0.04)]"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#40534c] text-white">
              <UserOutlined className="text-xs" />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 text-[13px] leading-[1.35] font-bold text-[#102a43]">
                    {authorName}
                </span>

                <span
                  title={roleLabel}
                  className={`inline-flex min-h-6 max-w-full shrink truncate rounded-full border px-2.5 text-[11px] leading-none font-semibold uppercase ${roleTone.badgeClassName}`}
                >
                    {roleLabel}
                </span>

                <span className="ml-auto shrink-0 whitespace-nowrap text-[11px] leading-[1.35] text-[#64748b]">
                    {formatCommentTimestamp(
                      comment.createdAt || comment.timestamp || "",
                    ) || "—"}
                </span>
              </div>

              <div className="overflow-wrap-anywhere whitespace-pre-wrap break-words text-[13px] leading-6 text-[#334e68]">
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