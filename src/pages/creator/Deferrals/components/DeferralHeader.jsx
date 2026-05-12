import React from "react";
import { Button } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";

/**
 * DeferralHeader Component
 * Displays page header with title, badge count, and action buttons
 */
const DeferralHeader = ({
  deferrals,
  onRefresh,
  loading,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#164679] mb-1 tracking-tight">
            Deferral Requests
          </h2>
          <p className="text-xs text-gray-500 m-0">
            {deferrals.length} records across active deferral workflows
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-none"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeferralHeader;