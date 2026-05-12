import React from "react";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

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
      <Button onClick={onClearFilters} className="deferrals-filter-clear">
        Clear
      </Button>
    </div>
  );
};

export default DeferralFilters;
