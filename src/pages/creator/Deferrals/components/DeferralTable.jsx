import React from "react";
import { Table, Empty, Spin } from "antd";

const stateClassName = "flex justify-center rounded-2xl border border-[#f0f0f0] bg-white p-10 shadow-[0_12px_32px_rgba(15,23,42,0.05)]";
const emptyShellClassName = "rounded-2xl border border-[#f0f0f0] bg-white p-10 shadow-[0_12px_32px_rgba(15,23,42,0.05)]";
const tableShellClassName = "rounded-2xl border border-[#f0f0f0] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)] [&_.ant-table]:bg-transparent [&_.ant-table-container]:border-none [&_.ant-table-thead>tr>th]:bg-[#f9fafb] [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.04em] [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[#f0f0f0] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-sm [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[#f5f5f5] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-row:hover>td]:bg-[#f9fafb] [&_.ant-pagination]:px-4 [&_.ant-pagination]:py-4 [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

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
      <div className={stateClassName}>
        <Spin tip="Loading extension applications..." />
      </div>
    ) : pendingExtensions.length === 0 ? (
      <Empty
        description={
          <div>
            <p className="mb-2 text-base">
              No extension applications pending approval
            </p>
            <p className="text-[#999]">
              No extension applications waiting for your approval.
            </p>
          </div>
        }
        className={emptyShellClassName}
      />
    ) : (
      <div className={tableShellClassName}>
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
    <div className={stateClassName}>
      <Spin tip={`Loading ${activeTab} deferrals...`} />
    </div>
  ) : data.length === 0 ? (
    <Empty
      description={
        <div>
          <p className="mb-2 text-base">
            {getEmptyDescription()}
          </p>
          <p className="text-[#999]">{getEmptySubtext()}</p>
        </div>
      }
      className={emptyShellClassName}
    />
  ) : (
    <div className={tableShellClassName}>
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
          className: "cursor-pointer",
        })}
      />
    </div>
  );
};

export default DeferralTable;
