/**
 * Actioned Module - Comment Handler Hook
 * Manages posting comments to deferrals
 */

import { useState } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import deferralApi from "../../../../service/deferralApi";

/**
 * useCommentHandler - Manages comment posting and state
 * @param {Object} config - {selected, onCommentPosted}
 * @returns {Object} - {newComment, setNewComment, postingComment, handlePostComment}
 */
export const useCommentHandler = (selected, onCommentPosted) => {
  const token = useSelector((s) => s.auth.token);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      message.error("Please enter a comment before posting");
      return;
    }

    if (!selected || !selected._id) {
      message.error("No deferral selected");
      return;
    }

    setPostingComment(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const commentData = {
        text: newComment.trim(),
        author: {
          name: currentUser.name || currentUser.user?.name || "User",
          role: currentUser.role || currentUser.user?.role || "user",
        },
        createdAt: new Date().toISOString(),
      };

      await deferralApi.postComment(selected._id, commentData, token);

      message.success("Comment posted successfully");
      setNewComment("");

      // Fetch updated deferral with new comment
      const refreshedDeferral = await deferralApi.getDeferralById(
        selected._id,
        token,
      );

      // Notify parent via callback
      if (onCommentPosted) {
        onCommentPosted(refreshedDeferral);
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
      message.error(error.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  return {
    newComment,
    setNewComment,
    postingComment,
    handlePostComment,
  };
};
