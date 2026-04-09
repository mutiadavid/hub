/**
 * Actioned Module - ActionedTable Component
 * Displays the main table of actioned (completed) deferrals
 */

import React from "react";
import { Table, Empty, Spin } from "antd";
import { getActionedColumns } from "../utils";

/**
 * ActionedTable - Main table component for completed deferrals
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Table component
 */
const ActionedTable = ({
  deferrals = [],
  loading = false,
  onRowClick = () => {},
  tableClassName = "actioned-table",
}) => {
  const columns = getActionedColumns();

  if (loading) {
    return (
      <div className="creator-tab-loading">
        <Spin />
      </div>
    );
  }

  if (deferrals.length === 0) {
    return (
      <div className="creator-tab-empty">
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                No completed deferrals
              </p>
              <p style={{ color: "#999" }}>All actioned items are shown here</p>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div
      className={tableClassName}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: "var(--color-white)",
      }}
    >
      <Table
        columns={columns}
        dataSource={deferrals}
        rowKey={(r) => r._id || r.id}
        tableLayout="fixed"
        size="middle"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          position: ["bottomCenter"],
        }}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          style: { cursor: "pointer" },
        })}
        style={{ flex: 1, background: "transparent" }}
      />
    </div>
  );
};

export default ActionedTable;
