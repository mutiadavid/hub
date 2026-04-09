import React from "react";
import { Input, Select, DatePicker, Button } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

const DeferralFilters = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <div className="deferrals-filters">
      <div className="deferrals-filters__grid">
        <div className="deferrals-filters__field">
          <Input
            placeholder="Search by DCL, customer, or deferral number"
            value={filters.search ?? ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>

        <div className="deferrals-filters__field">
          <Select
            value={filters.statusFilter ?? "all"}
            onChange={(value) => onFilterChange("statusFilter", value)}
            style={{ width: "100%" }}
          >
            <Select.Option value="all">All statuses</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="approved">Approved</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
            <Select.Option value="returned">Returned</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
          </Select>
        </div>

        <div className="deferrals-filters__field">
          <RangePicker
            value={filters.dateRange}
            onChange={(value) => onFilterChange("dateRange", value)}
            style={{ width: "100%" }}
            placeholder={["Start date", "End date"]}
          />
        </div>

        <div className="deferrals-filters__actions">
          <Button icon={<ClearOutlined />} onClick={onClearFilters}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeferralFilters;
