import React from "react";
import { Input, Select, DatePicker, Button } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

const DeferralFilters = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <div className="rounded-2xl border border-[rgba(214,189,152,0.18)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto] md:items-center">
        <div>
          <Input
            className="h-11 rounded-xl border-[rgba(214,189,152,0.22)] bg-[#fcfbf8]"
            placeholder="Search by DCL, customer, or deferral number"
            value={filters.search ?? ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>

        <div>
          <Select
            className="w-full"
            value={filters.statusFilter ?? "all"}
            onChange={(value) => onFilterChange("statusFilter", value)}
            size="large"
          >
            <Select.Option value="all">All statuses</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="approved">Approved</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
            <Select.Option value="returned">Returned</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
          </Select>
        </div>

        <div>
          <RangePicker
            className="h-11 w-full rounded-xl border-[rgba(214,189,152,0.22)] bg-[#fcfbf8]"
            value={filters.dateRange}
            onChange={(value) => onFilterChange("dateRange", value)}
            placeholder={["Start date", "End date"]}
          />
        </div>

        <div className="flex md:justify-end">
          <Button
            className="h-11 rounded-xl border-[rgba(214,189,152,0.22)] bg-white px-4 text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.32)] hover:bg-[#faf7f2] hover:text-(--color-text-dark)"
            icon={<ClearOutlined />}
            onClick={onClearFilters}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeferralFilters;
