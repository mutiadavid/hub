import { useState, useCallback } from "react";
import { message, Modal } from "antd";
import dayjs from "dayjs";
import deferralApi from "../../../../service/deferralApi.js";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";

/**
 * Custom hook for Deferral action handlers
 * Encapsulates all business logic for approve, rework, commenting, and downloads.
 */
export const useDeferralHandlers = (token, { deferrals, setDeferrals, selectedDeferral, setSelectedDeferral, setActiveTab, setModalVisible, loadDeferrals }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const handleApproveConfirm = useCallback(async (comment) => {
    if (!selectedDeferral) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      const response = await deferralApi.approveByChecker(
        selectedDeferral._id,
        { comment },
        token,
      );

      const updatedDeferral = response?.deferral || response;

      if (updatedDeferral && updatedDeferral._id) {
        message.success("Deferral approved successfully!");

        const updatedDeferrals = deferrals.map((d) =>
          d._id === updatedDeferral._id ? updatedDeferral : d,
        );
        setDeferrals(updatedDeferrals);
        setSelectedDeferral(updatedDeferral);

        setModalVisible(false);
        setSelectedDeferral(null);

        setTimeout(() => {
          loadDeferrals();
        }, 500);

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: updatedDeferral,
            }),
          );
        } catch (e) {
          console.error("Error dispatching event:", e);
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error approving deferral:", error);
      message.error(error?.message || "Failed to approve deferral");
    } finally {
      setActionLoading(false);
    }
  }, [selectedDeferral, token, deferrals, setDeferrals, setSelectedDeferral, setModalVisible, loadDeferrals]);

  const handleReturnForRework = useCallback(async (comment) => {
    if (!comment.trim()) {
      message.error("Please enter rework instructions");
      return;
    }

    setActionLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = currentUser._id || currentUser.user?._id;
      const userName = currentUser.name || currentUser.user?.name || currentUser.email;
      const userRole = currentUser?.role || currentUser?.user?.role;

      const isChecker =
        selectedDeferral.checker &&
        (selectedDeferral.checker._id === userId || selectedDeferral.checker === userId);
      const userIsCheckerRole =
        userRole === "checker" ||
        userRole === "co_checker" ||
        userRole === "cochecker";
      const actingAsChecker = isChecker || userIsCheckerRole;

      const response = actingAsChecker
        ? await deferralApi.returnForReworkByChecker(
            selectedDeferral._id,
            { comment, returnedBy: userId, returnedByName: userName, returnedByRole: "Checker" },
            token,
          )
        : await deferralApi.returnForReworkByCreator(
            selectedDeferral._id,
            { comment, returnedBy: userId, returnedByName: userName, returnedByRole: "Approver" },
            token,
          );

      const reworkSucceeded =
        !!response &&
        (response.success === true ||
          /returned\s+for\s+rework/i.test(String(response.message || "")));

      if (reworkSucceeded) {
        message.success("Deferral returned for rework successfully!");

        const returnedDeferral = response?.deferral || {
          ...selectedDeferral,
          status: actingAsChecker ? "returned_by_checker" : "returned_by_creator",
          lastReturnedByRole: actingAsChecker ? "checker" : "creator",
        };

        try {
          await deferralApi.sendEmailNotification(
            selectedDeferral._id,
            "returned_for_rework_to_rm",
            {
              comment,
              userName,
              returnedBy: actingAsChecker ? "Checker" : "Approver",
            },
          );
        } catch (emailErr) {
          console.warn("Failed to send email notification:", emailErr);
        }

        const updatedDeferrals = deferrals.map((d) =>
          d._id === selectedDeferral._id ? { ...d, ...returnedDeferral } : d,
        );
        setDeferrals(updatedDeferrals);

        setModalVisible(false);
        setSelectedDeferral(null);
        setActiveTab("completed");

        loadDeferrals();

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: returnedDeferral,
            }),
          );
        } catch {
          // Silently ignore event dispatch errors
        }
      } else {
        throw new Error(response?.message || "Failed to return deferral for rework");
      }
    } catch (error) {
      console.error("Error returning deferral for rework:", error);
      message.error(error.message || "Failed to return deferral for rework");
    } finally {
      setActionLoading(false);
    }
  }, [selectedDeferral, token, deferrals, setDeferrals, setSelectedDeferral, setModalVisible, setActiveTab, loadDeferrals]);

  const handleApproveCloseRequest = useCallback(async (approvalData) => {
    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    const payload = typeof approvalData === "string"
      ? { comment: approvalData }
      : approvalData || {};

    setActionLoading(true);
    try {
      const response = await deferralApi.approveCloseRequestByChecker(
        selectedDeferral._id,
        {
          comment: payload.comment || "Close request review submitted by checker",
          checkerDocumentDecisions: Array.isArray(payload.checkerDocumentDecisions)
            ? payload.checkerDocumentDecisions
            : [],
        },
        token,
      );

      const updatedDeferral = response?.deferral || response;
      if (!updatedDeferral?._id) {
        throw new Error("Invalid response while approving close request");
      }

      setDeferrals((prev) =>
        prev.map((d) => (d._id === updatedDeferral._id ? updatedDeferral : d)),
      );
      setSelectedDeferral(updatedDeferral);
      const normalizedStatus = String(updatedDeferral.status || "").trim().toLowerCase();
      const movedToCompleted = normalizedStatus === "closed";
      message.success(
        movedToCompleted
          ? "Close request approved. Deferral moved to completed"
          : "Checker review saved. Rejected documents returned to RM for correction",
      );

      window.dispatchEvent(
        new CustomEvent("deferral:updated", {
          detail: updatedDeferral,
        }),
      );

      setModalVisible(false);
      setSelectedDeferral(null);
      setActiveTab(movedToCompleted ? "completed" : "approved");
      loadDeferrals();
    } catch (error) {
      console.error("Error approving close request by checker:", error);
      message.error(error.message || "Failed to approve close request");
    } finally {
      setActionLoading(false);
    }
  }, [selectedDeferral, token, setDeferrals, setSelectedDeferral, setModalVisible, setActiveTab, loadDeferrals]);

  const handlePostComment = useCallback(async (newComment) => {
    if (!newComment.trim()) {
      message.error("Please enter a comment before posting");
      return;
    }

    if (!selectedDeferral || !selectedDeferral._id) {
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

      await deferralApi.postComment(selectedDeferral._id, commentData, token);

      message.success("Comment posted successfully");

      const refreshedDeferral = await deferralApi.getDeferralById(
        selectedDeferral._id,
        token,
      );
      setSelectedDeferral(refreshedDeferral);

      const updatedDeferrals = deferrals.map((d) =>
        d._id === refreshedDeferral._id ? refreshedDeferral : d,
      );
      setDeferrals(updatedDeferrals);

      return true;
    } catch (error) {
      console.error("Failed to post comment:", error);
      message.error(error.message || "Failed to post comment");
      return false;
    } finally {
      setPostingComment(false);
    }
  }, [selectedDeferral, token, deferrals, setDeferrals, setSelectedDeferral]);

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      await downloadDeferralPdf(selectedDeferral);
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      message.error("Failed to download deferral. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }, [selectedDeferral]);

  const handleExportCSV = useCallback((filteredDeferrals) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Deferral No,Customer No,Customer Name,DCL No,Loan Type,Days Remaining\n" +
      filteredDeferrals
        .map(
          (d) =>
            `${d.deferralNumber},${d.customerNumber},"${d.customerName}",${d.dclNo},${d.loanType}`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `pending_deferrals_${dayjs().format("YYYYMMDD_HHmmss")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Deferrals exported successfully!");
  }, []);

  return {
    actionLoading,
    postingComment,
    handleApproveConfirm,
    handleReturnForRework,
    handleApproveCloseRequest,
    handlePostComment,
    handleDownloadPDF,
    handleExportCSV,
  };
};

export default useDeferralHandlers;