import { useState, useEffect, useRef } from "react";
// import deferralApi from "../../../service/deferralApi.js";
import { message } from "antd";
import { getCurrentUser } from "../utils/deferralHelpers";
import deferralApi from "../../../../service/deferralApi";
import {
  hasAnyCloseRequestDocumentState,
  hasPendingCreatorCloseRequestDocuments,
} from "../../../../utils/deferralDocuments";

const QUEUE_TERMINAL_STATUSES = new Set([
  "approved",
  "deferral_approved",
  "rejected",
  "deferral_rejected",
  "returned_for_rework",
  "returned_by_creator",
  "returned_by_checker",
  "close_requested",
  "close_requested_creator_approved",
  "closed",
  "deferral_closed",
  "closed_by_co",
  "closed_by_creator",
]);

const isApprovalMarkedApproved = (approval) => {
  if (!approval || typeof approval !== "object") return false;
  if (approval.approved === true) return true;

  const status = String(
    approval.approvalStatus || approval.status || approval.state || "",
  )
    .trim()
    .toLowerCase();

  return status === "approved";
};

const hasAllApproversApproved = (deferral) => {
  if (deferral?.allApproversApproved === true) {
    return true;
  }

  const approvalFlow = Array.isArray(deferral?.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral?.approvers)
      ? deferral.approvers
      : Array.isArray(deferral?.approvals)
        ? deferral.approvals
        : [];

  if (!approvalFlow.length) {
    return false;
  }

  return approvalFlow.every(isApprovalMarkedApproved);
};

export const isCreatorQueueDeferral = (deferral) => {
  const status = String(deferral?.status || "").trim().toLowerCase();
  const creatorStatus = String(
    deferral?.creatorApprovalStatus || deferral?.creatorStatus || "",
  )
    .trim()
    .toLowerCase();
  const checkerStatus = String(
    deferral?.checkerApprovalStatus || deferral?.checkerStatus || "",
  )
    .trim()
    .toLowerCase();

  if (QUEUE_TERMINAL_STATUSES.has(status)) {
    return false;
  }

  if (creatorStatus === "approved" || checkerStatus === "approved") {
    return false;
  }

  return hasAllApproversApproved(deferral);
};

/**
 * Hook for managing deferral data fetching and state
 */
export const useDeferralData = (token) => {
  const [deferrals, setDeferrals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeferrals = async () => {
    setLoading(true);
    try {
      const pendingData = await deferralApi.getPendingDeferrals(token);
      const all = Array.isArray(pendingData) ? pendingData : [];

      const my = await deferralApi.getMyDeferrals(token);
      const myDeferrals = Array.isArray(my) ? my : [];

      const approvedDeferrals = await deferralApi.getApprovedDeferrals(token);
      const allApproved = Array.isArray(approvedDeferrals) ? approvedDeferrals : [];

      const closeWorkflowDeferrals = await deferralApi
        .getCloseWorkflowDeferrals(token)
        .catch(() => []);
      const closeWorkflow = Array.isArray(closeWorkflowDeferrals)
        ? closeWorkflowDeferrals
        : [];

      const approved = myDeferrals.filter((d) =>
        ["approved", "deferral_approved"].includes(
          (d.status || "").toLowerCase()
        )
      );
      const rejected = myDeferrals.filter((d) =>
        ["rejected", "deferral_rejected"].includes(
          (d.status || "").toLowerCase()
        )
      );
      const closed = myDeferrals.filter((d) =>
        [
          "closed",
          "deferral_closed",
          "closed_by_co",
          "closed_by_creator",
        ].includes((d.status || "").toLowerCase())
      );

      const allApprovedMerged = [...approved, ...allApproved];
      const uniqueApproved = Array.from(
        new Map(
          allApprovedMerged.map((d) => [d._id || d.id || d.deferralNumber, d])
        ).values()
      );

      // Only include deferrals that have been explicitly assigned to the creator
      // Do not include all pending deferrals that may not be assigned to this creator
      const pending = myDeferrals.filter((d) => {
        const status = String(d.status || "").trim().toLowerCase();
        return !["approved", "deferral_approved", "rejected", "deferral_rejected", "closed", "deferral_closed", "closed_by_co", "closed_by_creator"].includes(status);
      });

      const combined = [
        ...pending,
        ...uniqueApproved,
        ...rejected,
        ...closed,
        ...closeWorkflow,
      ];

      const uniqueCombined = Array.from(
        new Map(
          combined.map((d) => [d._id || d.id || d.deferralNumber, d])
        ).values()
      );

      return Array.isArray(uniqueCombined) ? uniqueCombined : [];
    } catch (error) {
      console.error("Error fetching deferrals:", error);
      message.error("Failed to load deferrals");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadDeferrals = async () => {
    const data = await fetchDeferrals();
    setDeferrals(data);
  };

  return { deferrals, setDeferrals, loading, loadDeferrals };
};

/**
 * Hook for managing deferral filtering by various criteria
 */
export const useDeferralFiltering = (deferrals, filters, activeTab) => {
  const [filteredDeferrals, setFilteredDeferrals] = useState([]);

  useEffect(() => {
    applyFilters();
  }, [deferrals, filters, activeTab]);

  const applyFilters = () => {
    const approvedStatuses = ["approved", "deferral_approved"];

    let base = deferrals.filter((d) => {
      const s = (d.status || "").toString().toLowerCase();
      if (activeTab === "pending") {
        return isCreatorQueueDeferral(d);
      }
      if (activeTab === "approved") {
        return approvedStatuses.includes(s);
      }
      if (activeTab === "closeRequests") {
        return hasPendingCreatorCloseRequestDocuments(d) ||
          (s === "close_requested" && !hasAnyCloseRequestDocumentState(d));
      }
      return true;
    });

    if (filters.priority !== "all") {
      base = base.filter((d) => d.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      base = base.filter(
        (d) =>
          (d.customerNumber || "").toLowerCase().includes(searchLower) ||
          (d.dclNo || d.dclNumber || "").toLowerCase().includes(searchLower) ||
          (d.customerName || "").toLowerCase().includes(searchLower) ||
          (d.deferralNumber || "").toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const dayjs = require("dayjs");
      base = base.filter((d) => {
        const createdDate = dayjs(d.createdAt);
        return (
          createdDate.isAfter(filters.dateRange[0]) &&
          createdDate.isBefore(filters.dateRange[1])
        );
      });
    }

    setFilteredDeferrals(base);
  };

  return { filteredDeferrals };
};

/**
 * Hook for managing modal state and selected deferral
 */
export const useDeferralModal = () => {
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [localDeferral, setLocalDeferral] = useState(null);

  useEffect(() => {
    setLocalDeferral(selectedDeferral);
  }, [selectedDeferral]);

  const openModal = (deferral) => {
    setSelectedDeferral(deferral);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDeferral(null);
  };

  return {
    selectedDeferral,
    setSelectedDeferral,
    modalVisible,
    setModalVisible,
    localDeferral,
    openModal,
    closeModal,
  };
};

/**
 * Hook for managing per-document decisions (approval/rejection by creator)
 */
export const useDocDecisions = (selectedDeferral, getDeferralDocumentBuckets) => {
  const [creatorDocDecisions, setCreatorDocDecisions] = useState({});
  const lastDeferralIdRef = useRef(null);

  useEffect(() => {
    if (!selectedDeferral) {
      setCreatorDocDecisions({});
      lastDeferralIdRef.current = null;
      return;
    }
    try {
      const currentDeferralId =
        selectedDeferral?._id || selectedDeferral?.id || null;

      if (
        Array.isArray(selectedDeferral.closeRequestDocuments) &&
        selectedDeferral.closeRequestDocuments.length > 0
      ) {
        const map = {};
        selectedDeferral.closeRequestDocuments.forEach((document) => {
          const key = String(document?.documentName || "")
            .trim()
            .toLowerCase();
          if (!key) return;
          map[key] = {
            status:
              (document?.creatorStatus &&
                String(document.creatorStatus).toLowerCase()) ||
              "pending",
            comment: document?.creatorComment || "",
          };
        });

        setCreatorDocDecisions((prev) => {
          if (!currentDeferralId || lastDeferralIdRef.current !== currentDeferralId) {
            return map;
          }

          const merged = { ...map };
          Object.keys(prev || {}).forEach((key) => {
            if (merged[key]) {
              merged[key] = {
                ...merged[key],
                ...prev[key],
                status: prev[key]?.status || merged[key].status,
                comment:
                  prev[key]?.comment !== undefined
                    ? prev[key].comment
                    : merged[key].comment,
              };
            }
          });
          return merged;
        });

        lastDeferralIdRef.current = currentDeferralId;
        return;
      }

      const { uploadedDocs = [] } =
        getDeferralDocumentBuckets(selectedDeferral);
      const map = {};
      uploadedDocs.forEach((u) => {
        const key = u.id || u._id || u.name || u.url || `${u.documentTarget || ""}`;
        map[key] = {
          status:
            (u.creatorApprovalStatus &&
              String(u.creatorApprovalStatus).toLowerCase()) ||
            (u.creatorApproved ? "approved" : "pending"),
          comment: u.creatorComment || "",
        };
      });

      setCreatorDocDecisions((prev) => {
        if (!currentDeferralId || lastDeferralIdRef.current !== currentDeferralId) {
          return map;
        }

        const merged = { ...map };
        Object.keys(prev || {}).forEach((key) => {
          if (merged[key]) {
            merged[key] = {
              ...merged[key],
              ...prev[key],
              status: prev[key]?.status || merged[key].status,
              comment:
                prev[key]?.comment !== undefined
                  ? prev[key].comment
                  : merged[key].comment,
            };
          }
        });
        return merged;
      });

      lastDeferralIdRef.current = currentDeferralId;
    } catch (e) {
      setCreatorDocDecisions({});
      lastDeferralIdRef.current = null;
    }
  }, [selectedDeferral]);

  const setDocDecision = (docKey, status, comment = "") => {
    setCreatorDocDecisions((prev) => ({
      ...prev,
      [docKey]: { ...(prev[docKey] || {}), status, comment },
    }));
  };

  const resetDocDecision = (docKey) => {
    setCreatorDocDecisions((prev) => ({
      ...prev,
      [docKey]: { ...(prev[docKey] || {}), status: "pending" },
    }));
  };

  return { creatorDocDecisions, setDocDecision, resetDocDecision };
};
