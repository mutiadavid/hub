import React from "react";
import { Input } from "antd";
import CommentHistory from "../../common/CommentHistory";
import "../../../styles/creatorDesignSystem.css";

const CommentSection = ({
  comments,
  commentsLoading,
  checkerComment,
  setCheckerComment,
  isDisabled,
  className = "",
}) => {
  return (
    <section
      className={`creator-card checker-review-comment-section ${className}`.trim()}
      style={{ marginBottom: 0 }}
    >
      <style>{`
        .checker-review-comment-section {
          height: 100%;
          overflow: visible;
        }
        .checker-review-comment-section .creator-card__body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 12px !important;
          min-height: 0;
          overflow: visible;
        }
        .checker-review-comment-box.ant-input {
          padding: 8px !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif !important;
        }
        .checker-review-comment-history-scroll {
          max-height: min(calc(5 * 48px + 4 * 8px + 36px), 46vh);
          overflow-y: auto;
          padding-right: 4px;
          padding-bottom: 10px;
          overflow-x: hidden;
          overscroll-behavior: contain;
          box-sizing: border-box;
        }
        .checker-review-comment-history-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .checker-review-comment-history-scroll::-webkit-scrollbar-thumb {
          background: rgba(214, 189, 152, 0.45);
          border-radius: 999px;
        }
        .checker-review-comment-history-scroll::-webkit-scrollbar-track {
          background: rgba(214, 189, 152, 0.08);
          border-radius: 999px;
        }
      `}</style>
      <div className="creator-card__header">Comments</div>
      <div className="creator-card__body">
        <div>
          <label className="creator-label">Checker Comment</label>
          <Input.TextArea
            className="checker-review-comment-box"
            rows={4}
            value={checkerComment}
            onChange={(e) => setCheckerComment(e.target.value)}
            placeholder="Enter checker remarks..."
            disabled={isDisabled}
          />
          <div className="creator-helper-text" style={{ marginTop: 4 }}>
            Comments are included when you save draft or submit.
          </div>
        </div>

        <div style={{ minHeight: 0, overflow: "visible" }}>
          <div className="checker-review-comment-history-scroll">
            <div className="creator-caption" style={{ marginBottom: 8 }}>
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
