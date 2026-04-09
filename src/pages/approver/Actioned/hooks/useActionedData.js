/**
 * Actioned Module - Data Fetching Hooks
 * Manages actioned deferrals data and modal refresh logic
 */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import deferralApi from "../../../../service/deferralApi";

/**
 * useActionedData - Fetches and manages actioned deferrals
 * @returns {Object} - {deferrals, loading, refetch}
 */
export const useActionedData = () => {
  const token = useSelector((s) => s.auth.token);
  const [deferrals, setDeferrals] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extensionsLoading, setExtensionsLoading] = useState(false);

  const fetchActioned = async () => {
    setLoading(true);
    try {
      const data = await deferralApi.getActionedDeferrals(token);
      setDeferrals(data || []);
    } catch (err) {
      message.error("Failed to load actioned items");
    } finally {
      setLoading(false);
    }
  };

  const fetchActionedExtensions = async () => {
    setExtensionsLoading(true);
    try {
      const data = await deferralApi.getApproverExtensionActioned(token);
      setExtensions(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error("Failed to load actioned extensions");
      setExtensions([]);
    } finally {
      setExtensionsLoading(false);
    }
  };

  useEffect(() => {
    fetchActioned();
    fetchActionedExtensions();

    // Listen for rejected/approved deferrals from other pages
    const handler = (e) => {
      try {
        const updated = e?.detail;
        if (!updated || !updated._id) return;

        const status = (updated.status || "").toLowerCase();
        // If the deferral was just rejected or approved, manage in list
        if (
          status === "rejected" ||
          status === "deferral_rejected" ||
          status === "approved" ||
          status === "deferral_approved"
        ) {
          setDeferrals((prev) => {
            const exists = prev.some(
              (d) => String(d._id) === String(updated._id),
            );
            if (exists) {
              return prev.map((d) => (d._id === updated._id ? updated : d));
            }
            // Add to the top if newly actioned
            return [updated, ...prev];
          });
        }
      } catch (err) {
        console.warn("deferral:updated handler error in Actioned", err);
      }
    };

    window.addEventListener("deferral:updated", handler);
    const extensionHandler = () => {
      fetchActionedExtensions();
    };

    window.addEventListener("extension:updated", extensionHandler);

    return () => {
      window.removeEventListener("deferral:updated", handler);
      window.removeEventListener("extension:updated", extensionHandler);
    };
  }, [token]);

  return {
    deferrals,
    extensions,
    loading,
    extensionsLoading,
    refetch: fetchActioned,
    refetchExtensions: fetchActionedExtensions,
    setDeferrals,
    setExtensions,
  };
};

/**
 * useDeferralModal - Manages modal state and polling
 * @param {Object} config - {selected, modalOpen}
 * @returns {Object} - Modal state and handlers
 */
export const useDeferralModal = (selected, modalOpen, token) => {
  const [deferral, setDeferral] = useState(selected);

  // Poll the deferral while modal is open to keep approval flow live
  useEffect(() => {
    if (!selected || !selected._id || !modalOpen) return;

    let cancelled = false;

    const fetchLatest = async () => {
      try {
        if (!selected._id) return;
        const fresh = await deferralApi.getDeferralById(selected._id, token);
        if (!cancelled && fresh) {
          setDeferral(fresh);
        }
      } catch (err) {
        console.debug(
          "Actioned modal: failed to refresh deferral",
          err?.message || err,
        );
      }
    };

    // Initial fetch
    fetchLatest();

    // Poll every 5 seconds
    const interval = setInterval(fetchLatest, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selected?._id, modalOpen, token]);

  // Update local state when selected changes
  useEffect(() => {
    setDeferral(selected);
  }, [selected]);

  return {
    deferral,
    setDeferral,
  };
};

/**
 * useActionedTabs - Manages active tab state
 * @returns {Object} - {activeTab, setActiveTab, handleTabChange}
 */
export const useActionedTabs = (initialTab = "deferrals") => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
  };
};
