import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import deferralApi from "../../../../service/deferralApi";
import { API_ORIGIN } from "../../../../config/runtimeConfig";

/**
 * Custom hook for fetching and managing queue data (deferrals and extensions)
 * Handles API calls, loading states, and real-time event updates
 */
export const useMyQueueData = () => {
  const [deferrals, setDeferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queueExtensions, setQueueExtensions] = useState([]);
  const [extensionsLoading, setExtensionsLoading] = useState(false);
 
  const token = useSelector((state) => state.auth.token);

  // Fetch pending deferrals for current approver
  const fetchDeferrals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await deferralApi.getApproverQueue(token);
      setDeferrals(data);
    } catch (error) {
      console.error("Failed to load deferral requests:", error);
      message.error("Failed to load deferral requests");
      setDeferrals([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch extension applications in approver queue
  const fetchExtensions = useCallback(async () => {
    setExtensionsLoading(true);
    try {
      const url = `${API_ORIGIN}/api/extensions/approver/queue`;
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const t = token || stored?.token;

      let res = await fetch(url, {
        headers: { ...(t ? { authorization: `Bearer ${t}` } : {}) },
      });

      // Try relative path fallback if absolute fails
      if (!res.ok) {
        try {
          res = await fetch("/api/extensions/approver/queue", {
            headers: { ...(t ? { authorization: `Bearer ${t}` } : {}) },
          });
        } catch (e) {
          console.error("Fallback fetch failed:", e);
        }
      }

      if (res && res.ok) {
        const data = await res.json().catch(() => []);

        const uniqueExtensions = Array.isArray(data)
          ? Array.from(
              new Map(
                data.map((ext, index) => [
                  ext.id || ext._id || `${ext.deferralId || ext.deferral?.id || ext.deferral?._id || "extension"}-${index}`,
                  ext,
                ]),
              ).values(),
            )
          : [];

        setQueueExtensions(uniqueExtensions);
      } else {
        setQueueExtensions([]);
      }
    } catch (err) {
      console.error(
        "Failed to load extension applications for approver queue:",
        err
      );
      setQueueExtensions([]);
    } finally {
      setExtensionsLoading(false);
    }
  }, [token]);

  // Initial data load
  useEffect(() => {
    fetchDeferrals();
    fetchExtensions();
  }, [fetchDeferrals, fetchExtensions]);

  // Listen for deferral updates from other components
  useEffect(() => {
    const handleDeferralUpdated = () => {
      fetchDeferrals();
    };

    const handleExtensionUpdated = () => {
      // Refetch extensions when they're updated
      fetchExtensions();
    };

    const handleExtensionCreated = () => {
      // Refetch extensions when new ones are created
      fetchExtensions();
    };

    window.addEventListener("deferral:updated", handleDeferralUpdated);
    window.addEventListener("extension:updated", handleExtensionUpdated);
    window.addEventListener("extension:created", handleExtensionCreated);

    return () => {
      window.removeEventListener("deferral:updated", handleDeferralUpdated);
      window.removeEventListener("extension:updated", handleExtensionUpdated);
      window.removeEventListener("extension:created", handleExtensionCreated);
    };
  }, [fetchDeferrals, fetchExtensions]);

  return {
    deferrals,
    isLoading,
    queueExtensions,
    extensionsLoading,
    refetchDeferrals: fetchDeferrals,
    refetchExtensions: fetchExtensions,
    setDeferrals,
  };
};

/**
 * Custom hook for managing queue modal state and deferral detail loading
 */
export const useMyQueueModal = () => {
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [detailOverrides, setDetailOverrides] = useState(null);

  const token = useSelector((state) => state.auth.token);

  const fetchFullDeferralForExtension = useCallback(
    async (extensionCandidate) => {
      const possibleId =
        extensionCandidate?.deferralId ||
        extensionCandidate?.deferral?._id ||
        extensionCandidate?.deferral?.id ||
        extensionCandidate?.linkedDeferral?._id ||
        extensionCandidate?.linkedDeferral?.id ||
        extensionCandidate?.deferralIdString;

      if (!possibleId || !token) {
        return (
          extensionCandidate?.linkedDeferral ||
          extensionCandidate?.deferral ||
          null
        );
      }

      try {
        const fetched = await deferralApi.getDeferralById(possibleId, token);
        if (fetched && (fetched._id || fetched.id)) {
          return fetched;
        }
      } catch (err) {
        console.error("Failed to fetch deferral for extension:", err);
      }

      return (
        extensionCandidate?.linkedDeferral ||
        extensionCandidate?.deferral ||
        null
      );
    },
    [token],
  );

  const refreshSelectedExtension = useCallback(
    async (extensionCandidate) => {
      const extensionId =
        extensionCandidate?._id ||
        extensionCandidate?.id ||
        selectedExtension?._id ||
        selectedExtension?.id;

      if (!extensionId || !token) {
        return null;
      }

      try {
        const freshExtension = await deferralApi.getExtensionById(extensionId, token);
        if (freshExtension) {
          // Only fetch full deferral if we don't have it or if it's explicitly needed
          let fullDeferral = selectedExtension?.deferral || selectedExtension?.linkedDeferral;
          if (!fullDeferral) {
            fullDeferral = await fetchFullDeferralForExtension(freshExtension);
          }
         
          const mergedExtension = {
            ...freshExtension,
            deferral: fullDeferral || freshExtension.deferral || null,
            linkedDeferral: fullDeferral || freshExtension.linkedDeferral || freshExtension.deferral || null,
          };
          setSelectedExtension(mergedExtension);
          return mergedExtension;
        }
      } catch (err) {
        console.error("Failed to refresh extension details:", err);
      }

      return null;
    },
    [fetchFullDeferralForExtension, selectedExtension, token],
  );

  // Handle opening extension details
  const handleOpenExtensionDetails = useCallback(
    async (extension) => {
      if (!extension) return;

      const freshExtension = (await refreshSelectedExtension(extension)) || extension;

      const approvedDeferral =
        (await fetchFullDeferralForExtension(freshExtension)) ||
        freshExtension.deferral ||
        freshExtension.linkedDeferral ||
        extension.deferral ||
        null;

      if (!approvedDeferral || !approvedDeferral._id) {
        message.error("Unable to load deferral details for this extension");
        return;
      }

      // Calculate override due date
      const overrideDueDate =
        freshExtension.requestedDaysSought && (approvedDeferral.nextDueDate || approvedDeferral.nextDocumentDueDate)
          ? require("dayjs")(
              approvedDeferral.nextDueDate || approvedDeferral.nextDocumentDueDate
            )
              .add(freshExtension.requestedDaysSought, "day")
              .toISOString()
          : null;

      setSelectedDeferral(approvedDeferral);
      setDetailOverrides({
        headerTag: "EXTENSION APPLICATION",
        overrideDaysSought: freshExtension.requestedDaysSought,
        overrideNextDueDate: overrideDueDate,
        readOnly: false,
        overrideApprovals: {
          approvers: freshExtension.approvers || [],
          allApproversApproved: freshExtension.allApproversApproved || false,
          creatorApprovalStatus: freshExtension.creatorApprovalStatus || "pending",
          checkerApprovalStatus: freshExtension.checkerApprovalStatus || "pending",
          creatorApprovedBy: freshExtension.creatorApprovedBy,
          checkerApprovedBy: freshExtension.checkerApprovedBy,
          creatorApprovalDate: freshExtension.creatorApprovalDate,
          checkerApprovalDate: freshExtension.checkerApprovalDate,
          status: freshExtension.status,
        },
      });
      setSelectedExtension({
        ...freshExtension,
        deferral: approvedDeferral,
        linkedDeferral: approvedDeferral,
      });
      setExtensionModalOpen(true);
    },
    [fetchFullDeferralForExtension, refreshSelectedExtension]
  );

  useEffect(() => {
    if (!extensionModalOpen || !selectedExtension) {
      return undefined;
    }

    let disposed = false;

    const syncSelectedExtension = async () => {
      const freshExtension = await refreshSelectedExtension(selectedExtension);
      if (disposed || !freshExtension) {
        return;
      }

      setDetailOverrides((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          overrideDaysSought: freshExtension.requestedDaysSought,
          overrideApprovals: {
            ...(prev.overrideApprovals || {}),
            approvers: freshExtension.approvers || [],
            allApproversApproved: freshExtension.allApproversApproved || false,
            creatorApprovalStatus: freshExtension.creatorApprovalStatus || "pending",
            checkerApprovalStatus: freshExtension.checkerApprovalStatus || "pending",
            creatorApprovedBy: freshExtension.creatorApprovedBy,
            checkerApprovedBy: freshExtension.checkerApprovedBy,
            creatorApprovalDate: freshExtension.creatorApprovalDate,
            checkerApprovalDate: freshExtension.checkerApprovalDate,
            status: freshExtension.status,
          },
        };
      });
    };

    syncSelectedExtension();
    const intervalId = window.setInterval(syncSelectedExtension, 10000);

    const handleExtensionEvent = (event) => {
      const updatedExtension = event?.detail;
      const updatedId = updatedExtension?._id || updatedExtension?.id;
      const selectedId = selectedExtension?._id || selectedExtension?.id;

      if (!updatedId || String(updatedId) !== String(selectedId)) {
        return;
      }

      syncSelectedExtension();
    };

    window.addEventListener("extension:updated", handleExtensionEvent);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("extension:updated", handleExtensionEvent);
    };
  }, [extensionModalOpen, refreshSelectedExtension, selectedExtension]);

  // Close modals
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedDeferral(null);
    setNewComment("");
    setPostingComment(false);
  }, []);

  const handleCloseExtensionModal = useCallback(() => {
    setExtensionModalOpen(false);
    setSelectedExtension(null);
    setDetailOverrides(null);
  }, []);

  return {
    selectedDeferral,
    setSelectedDeferral,
    modalOpen,
    setModalOpen,
    newComment,
    setNewComment,
    postingComment,
    setPostingComment,
    selectedExtension,
    setSelectedExtension,
    extensionModalOpen,
    setExtensionModalOpen,
    detailOverrides,
    setDetailOverrides,
    handleOpenExtensionDetails,
    handleCloseModal,
    handleCloseExtensionModal,
  };
};

/**
 * Custom hook for managing active tab state
 */
export const useMyQueueTabs = (initialTab = "deferrals") => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
  }, []);

  return { activeTab, setActiveTab, handleTabChange };
};
