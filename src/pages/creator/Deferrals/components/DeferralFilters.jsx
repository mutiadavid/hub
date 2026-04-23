import React from "react";
import { Input, DatePicker, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const cardClassName = "rounded-2xl border border-[rgba(214,189,152,0.18)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]";
const searchClassName = "h-11 rounded-xl border-[rgba(214,189,152,0.22)] bg-[#fcfbf8]";
const dateClassName = "h-11 w-full rounded-xl border-[rgba(214,189,152,0.22)] bg-[#fcfbf8]";
const clearButtonClassName = "h-11 rounded-xl border-[rgba(214,189,152,0.22)] bg-white px-4 text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.32)] hover:bg-[#faf7f2] hover:text-(--color-text-dark)";

/**
 * DeferralFilters Component
 * Display and manage filter criteria for deferrals
 */
const DeferralFilters = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <div className={cardClassName}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)_auto] md:items-center">
      <Input
        placeholder="Search by DCL No, deferral no, customer name or number"
        prefix={<SearchOutlined />}
        value={filters.search}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        allowClear
        className={searchClassName}
      />

      <RangePicker
        className={dateClassName}
        placeholder={["Start date", "End date"]}
        value={filters.dateRange}
        onChange={(dates) => onFilterChange({ ...filters, dateRange: dates })}
        format="DD/MM/YYYY"
      />

      <Button onClick={onClearFilters} className={clearButtonClassName}>
        Clear
      </Button>
      </div>
    </div>
  );
};

export default DeferralFilters;
