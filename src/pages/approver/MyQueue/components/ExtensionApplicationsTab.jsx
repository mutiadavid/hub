import React from "react";
import { Table, Empty, Spin } from "antd";
import { getExtensionColumns } from "../utils/tableColumns";

/**
 * ExtensionApplicationsTab Component
 * Displays pending extension applications in a table
 * Allows users to click rows to view extension details
 */
const ExtensionApplicationsTab = ({
  extensions = [],
  loading = false,
  tableClassName = "",
  onOpenExtensionDetails = () => {},
}) => {
  const extColumns = getExtensionColumns();

  if (loading) {
    return (
      <div className="creator-tab-loading">
        <Spin />
      </div>
    );
  }

  if (!Array.isArray(extensions) || extensions.length === 0) {
    return (
      <div className="creator-tab-empty">
        <Empty description="No extension applications" />
      </div>
    );
  }

  return (
    <div className={tableClassName}>
      <Table
        columns={extColumns}
        dataSource={extensions}
        rowKey={(rec) =>
          rec.id ||
          rec._id ||
          `${rec.deferralId || rec.deferral?.id || Math.random()}`
        }
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          position: ["bottomCenter"],
        }}
        tableLayout="fixed"
        scroll={{ x: 1060 }}
        size="middle"
        onRow={(record) => ({
          onClick: () => onOpenExtensionDetails(record),
          style: { cursor: "pointer" },
        })}
      />
    </div>
  );
};

export default ExtensionApplicationsTab;