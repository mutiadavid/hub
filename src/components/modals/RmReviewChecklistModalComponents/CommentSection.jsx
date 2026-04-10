import React from "react";
import { Input } from "antd";
import CommentHistory from "../../common/CommentHistory";
import "../../../styles/creatorDesignSystem.css";

const CommentSection = ({
  rmGeneralComment,
  setRmGeneralComment,
  onEdit,
  isActionAllowed,
  comments,
  commentsLoading,
}) => {
  const cardFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
  const gray700 = "#374151";

  return (
    <section
      className="creator-card rm-review-comment-section"
      style={{
        marginBottom: 0,
        fontFamily: cardFontFamily,
        fontSize: 12,
        borderRadius: 14,
        boxShadow: "0 10px 26px rgba(26, 54, 54, 0.08)",
      }}
    >
      <style>{`
        .rm-review-comment-section {
          height: 100%;
          overflow: visible;
        }
        .rm-review-comment-section .creator-card__body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 14px !important;
          min-height: 0;
          overflow: visible;
        }
        .rm-review-comment-section .creator-card__header {
          padding: 10px 14px !important;
          font-size: 12px !important;
          color: ${gray700} !important;
          font-family: ${cardFontFamily} !important;
        }
        .rm-review-comment-box.ant-input {
          padding: 6px 8px !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: ${gray700} !important;
          font-family: ${cardFontFamily} !important;
          line-height: 1.45 !important;
        }
        .rm-review-comment-history-scroll {
          max-height: min(calc(5 * 48px + 4 * 8px + 36px), 46vh);
          overflow-y: auto;
          padding-right: 4px;
          padding-bottom: 10px;
          overflow-x: hidden;
          overscroll-behavior: contain;
          box-sizing: border-box;
        }
        .rm-review-comment-history-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .rm-review-comment-history-scroll::-webkit-scrollbar-thumb {
          background: rgba(214, 189, 152, 0.45);
          border-radius: 999px;
        }
        .rm-review-comment-history-scroll::-webkit-scrollbar-track {
          background: rgba(214, 189, 152, 0.08);
          border-radius: 999px;
        }
      `}</style>
      <div className="creator-card__header">Comments</div>
      <div className="creator-card__body">
        <div>
          <label className="creator-label" style={{ fontSize: 12, color: gray700, fontFamily: cardFontFamily }}>
            RM General Comment
          </label>
          <Input.TextArea
            className="rm-review-comment-box"
            rows={3}
            value={rmGeneralComment}
            onChange={(e) => {
              if (typeof onEdit === "function") {
                onEdit();
              }
              setRmGeneralComment(e.target.value);
            }}
            placeholder="Enter RM general remarks..."
            disabled={!isActionAllowed}
          />
          <div
            className="creator-helper-text"
            style={{ marginTop: 4, fontSize: 12, color: gray700, fontFamily: cardFontFamily }}
          >
            Comments are included when you save draft or submit.
          </div>
        </div>

        <div style={{ minHeight: 0, overflow: "visible" }}>
          <div className="rm-review-comment-history-scroll">
            <div
              className="creator-caption"
              style={{ marginBottom: 8, fontSize: 12, color: gray700, fontFamily: cardFontFamily }}
            >
              Comment Trail & History
            </div>
            <CommentHistory comments={comments} isLoading={commentsLoading} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommentSection;
