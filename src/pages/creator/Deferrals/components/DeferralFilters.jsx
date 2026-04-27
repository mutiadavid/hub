import React from "react";
import { Input, DatePicker, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

/**
 * DeferralFilters Component
 * Display and manage filter criteria for deferrals
 */
const DeferralFilters = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <div className="deferrals-filters">
      <Input
        placeholder="Search by DCL No, deferral no, customer name or number"
        prefix={<SearchOutlined />}
        value={filters.search}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        allowClear
        className="deferrals-filter deferrals-filter--search creator-input"
      />

      <RangePicker
        className="deferrals-filter deferrals-filter--date"
        style={{ width: "100%" }}
        placeholder={["Start date", "End date"]}
        value={filters.dateRange}
        onChange={(dates) => onFilterChange({ ...filters, dateRange: dates })}
        format="DD/MM/YYYY"
      />

      <Button onClick={onClearFilters} className="deferrals-filter-clear">
        Clear
      </Button>
    </div>
  );
};

export default DeferralFilters;
