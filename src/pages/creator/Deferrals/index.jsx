import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Spin, Empty } from "antd";
import "../../../styles/creatorDesignSystem.css";

// Components
import DeferralHeader from "./components/DeferralHeader";
import DeferralTabs from "./components/DeferralTabs";
import DeferralFilters from "./components/DeferralFilters";
import DeferralStatusAlert from "./components/DeferralStatusAlert";
import DeferralTable from "./components/DeferralTable";
import DeferralDetailsModal from "./components/DeferralDetailsModal";

// Hooks
import {
  useDeferralData,
  useDeferralFiltering,
  useDeferralModal,
} from "./hooks";

/**
 * Deferrals - Main Page Component (Refactored)
 * Displays deferral requests with filtering, status tracking, and approval workflows
 *
 * Features:
 * - Tabbed view for different deferral states (pending, approved, close requests)
 * - Real-time status alerts
 * - Search and date filtering
 * - Modal for detailed deferral review and actions
 * - Export functionality
 */
const Deferrals = () => {
  const { token } = useSelector((state) => state.auth);

  // State Management
  const [activeTab, setActiveTab] = useState("pending");
  const [filters, setFilters] = useState({
    priority: "all",
    search: "",
    dateRange: null,
  });

  // Data Fetching
  const { deferrals, loading, loadDeferrals } =
    useDeferralData(token);

  // Filtering
  const { filteredDeferrals } = useDeferralFiltering(
    deferrals,
    filters,
    activeTab
  );

  // Modal Management
  const { selectedDeferral, modalVisible, openModal, closeModal } =
    useDeferralModal();

  // Initialize data on mount
  useEffect(() => {
    if (token) {
      loadDeferrals();
    }
  }, [token, loadDeferrals]);

  // Count tabs by status
  const pendingCount = deferrals.filter((d) => {
    const status = String(d.status || "").toLowerCase();
    return !["approved", "rejected", "closed", "deferral_closed"].includes(
      status
    );
  }).length;

  const approvedCount = deferrals.filter(
    (d) =>
      ["approved", "deferral_approved"].includes(
        String(d.status || "").toLowerCase()
      )
  ).length;

  const closeRequestsCount = deferrals.filter((d) => {
    const status = String(d.status || "").toLowerCase();
    return status.includes("close_request");
  }).length;

  const extensionsCount = deferrals.filter((d) => d.isExtension === true)
    .length;

  // Handle Refresh
  const handleRefresh = async () => {
    await loadDeferrals();
  };

  // Handle Export
  const handleExport = async () => {
    try {
      // Simple export to CSV
      const csv = [
        [
          "Deferral Number",
          "Customer",
          "Status",
          "Created Date",
          "Due Date",
          "Priority",
        ],
        ...filteredDeferrals.map((d) => [
          d.deferralNumber || "N/A",
          d.customerName || "N/A",
          d.status || "N/A",
          d.createdAt
            ? new Date(d.createdAt).toLocaleDateString()
            : "N/A",
          d.nextDueDate
            ? new Date(d.nextDueDate).toLocaleDateString()
            : "N/A",
          d.priority || "N/A",
        ]),
      ].map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `deferrals-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Handle Row Click
  const handleRowClick = (record) => {
    openModal(record);
  };

  // Handle Table Refresh
  const handleTableRefresh = () => {
    if (selectedDeferral) {
      // Refresh the selected deferral data
      loadDeferrals();
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center p-8">
        <Empty description="Not authenticated" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <DeferralHeader
        deferrals={deferrals}
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading}
        disabledExport={filteredDeferrals.length === 0}
      />

      {/* Tab Navigation */}
      <DeferralTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        closeRequestsCount={closeRequestsCount}
        extensionsCount={extensionsCount}
      />

      {/* Filters */}
      <DeferralFilters filters={filters} onFiltersChange={setFilters} />

      {/* Main Content */}
      <Spin spinning={loading}>
        {filteredDeferrals.length > 0 ? (
          <>
            {/* Status Alert - Show for first item */}
            {selectedDeferral && (
              <DeferralStatusAlert deferral={selectedDeferral} />
            )}

            {/* Table */}
            <DeferralTable
              deferrals={filteredDeferrals}
              onRowClick={handleRowClick}
              loading={loading}
            />
          </>
        ) : (
          <Empty description="No deferrals found for the selected filters" />
        )}
      </Spin>

      {/* Modal for Details */}
      {modalVisible && selectedDeferral && (
        <DeferralDetailsModal
          visible={modalVisible}
          deferral={selectedDeferral}
          onClose={closeModal}
          onRefresh={handleTableRefresh}
        />
      )}
    </div>
  );
};

export default Deferrals;
