import React from "react";
import CommentHistory from "../../common/CommentHistory";
import "../../../styles/creatorDesignSystem.css";

const CommentHistorySection = ({ comments, commentsLoading }) => {
  const maxVisibleComments = 5;
  const estimatedCommentHeight = 78;
  const commentViewportHeight = maxVisibleComments * estimatedCommentHeight;
  const shouldScroll = (comments?.length || 0) > maxVisibleComments;

  return (
    <section
      className="creator-review-comments-card creator-review-comments-card--inline"
      style={{
        marginTop: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: 12,
        gap: 12,
      }}
    >
      <div className="creator-caption">Comments</div>
      <div
        style={{
          overflowY: shouldScroll ? "scroll" : "visible",
          maxHeight: shouldScroll ? `${commentViewportHeight}px` : "none",
          paddingRight: 4,
          scrollbarColor: "rgba(148, 163, 184, 0.9) rgba(241, 245, 249, 0.9)",
          scrollbarWidth: "thin",
        }}
      >
        <CommentHistory comments={comments} isLoading={commentsLoading} />
      </div>
    </section>
  );
};

export default CommentHistorySection;
