import React from "react";
import { Spin } from "antd";

const DeferralReviewSidebar = ({
  isPostingComment,
  history,
}) => {
  const recentComments = Array.isArray(history) ? [...history].reverse() : [];

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-[rgba(214,189,152,0.2)] bg-white p-3.5 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold tracking-[0.08em] text-(--color-text-medium) uppercase">Recent Comments</div>
        {isPostingComment ? (
          <div className="flex justify-center py-2 text-xs leading-5 text-(--color-text-medium)">
            <Spin size="small" />
          </div>
        ) : recentComments.length === 0 ? (
          <div className="text-xs leading-5 text-(--color-text-medium)">No user comments yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentComments.map((item, index) => (
              <div key={`${item.date || item.createdAt || "comment"}-${index}`} className={index === 0 ? "" : "border-t border-[rgba(214,189,152,0.14)] pt-2.5"}>
                <div className="mb-1 flex justify-between gap-2 max-md:flex-col max-md:items-start">
                  <span className="overflow-wrap-anywhere break-word text-xs font-semibold text-(--color-primary-dark)">{item.user || item.userName || "User"}</span>
                  <span className="text-[11px] text-[#94a3b8]">{item.date || item.createdAt || item.timestamp || ""}</span>
                </div>
                <div className="overflow-wrap-anywhere break-word text-xs leading-5 text-(--color-text-medium)">
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
