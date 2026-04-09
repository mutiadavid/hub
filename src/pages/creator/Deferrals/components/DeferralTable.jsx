import React from "react";
import { Table, Empty, Spin } from "antd";

/**
 * DeferralTable Component
 * Displays deferrals in table format with sorting, pagination, and row interactions
 */
const DeferralTable = ({
  columns,
  data,
  loading,
  activeTab,
  onRowClick,
  customTableStyles,
  computeExtensionColumns,
  pendingExtensions,
  extensionsLoading,
}) => {
  // Use provided columns or compute them
  const tableColumns = columns || [];

  const getEmptyDescription = () => {
    switch (activeTab) {
      case "pending":
        return "No deferrals in your queue";
      case "approved":
        return "No fully approved deferrals found";
      case "closeRequests":
        return "No close requests found";
      default:
        return "No completed deferrals found";
    }
  };

  const getEmptySubtext = () => {
    switch (activeTab) {
      case "pending":
        return "No deferrals are currently waiting for CO Creator approval.";
      case "approved":
        return "No deferrals have been fully approved yet";
      case "closeRequests":
        return "No RM close requests awaiting creator approval";
      default:
        return "No deferrals have been completed yet";
    }
  };

  if (activeTab === "extensions") {
    const extensionColumns = computeExtensionColumns
      ? computeExtensionColumns()
      : [];
    return extensionsLoading ? (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
        }}
      >
        <Spin tip="Loading extension applications..." />
      </div>
    ) : pendingExtensions.length === 0 ? (
      <Empty
        description={
          <div>
            <p style={{ fontSize: 16, marginBottom: 8 }}>
              No extension applications pending approval
            </p>
            <p style={{ color: "#999" }}>
              No extension applications waiting for your approval.
            </p>
          </div>
        }
        style={{ padding: 40 }}
      />
    ) : (
      <div className="deferrals-table creator-table-shell deferrals-table-shell">
        <style>{customTableStyles}</style>
        <Table
          columns={extensionColumns}
          dataSource={pendingExtensions}
          rowKey={(record) => record.id}
          size="middle"
          tableLayout="fixed"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomCenter"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} extension applications`,
          }}
        />
      </div>
    );
  }

  return loading ? (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
      }}
    >
      <Spin tip={`Loading ${activeTab} deferrals...`} />
    </div>
  ) : data.length === 0 ? (
    <Empty
      description={
        <div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            {getEmptyDescription()}
          </p>
          <p style={{ color: "#999" }}>{getEmptySubtext()}</p>
        </div>
      }
      style={{ padding: 40 }}
    />
  ) : (
    <div className="deferrals-table creator-table-shell deferrals-table-shell">
      <style>{customTableStyles}</style>
      <Table
        columns={tableColumns}
        dataSource={data}
        rowKey={(record) => record._id || record.id}
        size="middle"
        tableLayout="fixed"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          position: ["bottomCenter"],
          showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} ${activeTab === "pending" ? "queued" : activeTab} deferrals`,
        }}
        scroll={{ x: 1300 }}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          style: { cursor: "pointer" },
        })}
      />
    </div>
  );
};

export default DeferralTable;
