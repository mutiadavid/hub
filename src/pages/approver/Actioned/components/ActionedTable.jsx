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
      <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[rgba(214,189,152,0.2)] bg-white">
        <Spin />
      </div>
    );
  }

  if (deferrals.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[rgba(214,189,152,0.2)] bg-white">
        <Empty
          description={
            <div>
              <p className="mb-2 text-base">
                No completed deferrals
              </p>
              <p className="text-[#999]">All actioned items are shown here</p>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className={`${tableClassName} flex flex-1 flex-col bg-white`}>
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
          className: "cursor-pointer",
        })}
        className="flex-1 bg-transparent"
      />
    </div>
  );
};

export default ActionedTable;
