import React from "react";
import { Card, Row, Col, Input, DatePicker, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

const cardClassName = "rounded-lg border border-[rgba(214,189,152,0.2)] bg-white p-4 shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const fieldRowClassName = "flex flex-wrap items-center gap-3";
const searchClassName = "w-full [&_.ant-input-affix-wrapper]:h-10 [&_.ant-input-affix-wrapper]:rounded-md [&_.ant-input-affix-wrapper]:border-[rgba(214,189,152,0.2)] [&_.ant-input-affix-wrapper]:bg-white [&_.ant-input-affix-wrapper]:shadow-none [&_.ant-input-affix-wrapper:hover]:border-(--color-primary-dark) [&_.ant-input-affix-wrapper-focused]:border-(--color-primary-dark) [&_.ant-input]:text-xs [&_.ant-input]:text-(--color-text-medium)";
const pickerClassName = "w-full [&.ant-picker]:h-10 [&.ant-picker]:rounded-md [&.ant-picker]:border-[rgba(214,189,152,0.2)] [&.ant-picker]:shadow-none hover:[&.ant-picker]:border-(--color-primary-dark) [&.ant-picker-focused]:border-(--color-primary-dark) [&_.ant-picker-input>input]:text-xs [&_.ant-picker-input>input]:text-(--color-text-medium)";
const selectClassName = "w-full [&_.ant-select-selector]:h-10! [&_.ant-select-selector]:rounded-md! [&_.ant-select-selector]:border-[rgba(214,189,152,0.2)]! [&_.ant-select-selector]:bg-white! [&_.ant-select-selector]:shadow-none! hover:[&_.ant-select-selector]:border-(--color-primary-dark)! [&.ant-select-focused_.ant-select-selector]:border-(--color-primary-dark)! [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:text-(--color-text-medium) [&_.ant-select-selection-placeholder]:text-xs [&_.ant-select-selection-placeholder]:text-(--color-text-medium)";
const buttonClassName = "h-10! rounded-md! border-[rgba(214,189,152,0.2)]! bg-white! px-3! text-xs! font-semibold! text-(--color-text-medium)! shadow-none! hover:border-(--color-primary-dark)! hover:text-(--color-primary-dark)!";

export default function ReportsFilters({
  activeTab,
  filters,
  setFilters,
  clearFilters,
}) {
  const isDclTab = activeTab === "allDCLs" || activeTab === "dclCharts";
  const isDeferralTab = activeTab === "deferrals" || activeTab === "deferralCharts";
  const isTatTab = activeTab === "tatConsumed" || activeTab === "tatConsumedCharts";
  const statusOptions = [
    "Pending",
    "CoCreatorReview",
    "RMReview",
    "CoCheckerReview",
    "Approved",
    "Rejected",
    "Active",
    "Completed",
    "Revived",
    "Deferred",
  ];

  return (
    <Card className={`${cardClassName} [&_.ant-card-body]:p-0`} size="small">
      <Row gutter={[12, 12]} align="middle" wrap>
        {isTatTab && (
          <Col xs={24}>
            <div className={fieldRowClassName}>
              <div className="min-w-60 flex-[1_1_260px]">
                <Input
                  className={searchClassName}
                  prefix={<SearchOutlined />}
                  placeholder="Search by item ID, customer, DCL..."
                  value={filters.searchText}
                  onChange={(e) =>
                    setFilters({ ...filters, searchText: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-[140px] flex-[1_1_140px]">
                <Input
                  className={searchClassName}
                  placeholder="Filter by Branch"
                  value={filters.branch}
                  onChange={(e) =>
                    setFilters({ ...filters, branch: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-[140px] flex-[1_1_140px]">
                <Input
                  className={searchClassName}
                  placeholder="Filter by Segment"
                  value={filters.segment}
                  onChange={(e) =>
                    setFilters({ ...filters, segment: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-60 flex-[1_1_260px]">
                <RangePicker
                  className={pickerClassName}
                  placeholder={["Start Date", "End Date"]}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                  size="middle"
                />
              </div>
              <div className="basis-[220px]">
                <Select
                  className={selectClassName}
                  placeholder="Filter by status"
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value })}
                  size="middle"
                >
                  <Option value="">All Statuses</Option>
                  {statusOptions.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="basis-[180px]">
                <Select
                  className={selectClassName}
                  placeholder="Workflow type"
                  value={filters.itemType}
                  onChange={(value) => setFilters({ ...filters, itemType: value })}
                  size="middle"
                >
                  <Option value="">All Types</Option>
                  <Option value="Deferral">Deferrals</Option>
                  <Option value="DCL">DCL</Option>
                </Select>
              </div>
              <div>
                <Button onClick={clearFilters} size="middle" className={buttonClassName}>
                  Clear
                </Button>
              </div>
            </div>
          </Col>
        )}

        {/* Left Section - Deferral Filter */}
        {isDeferralTab && !isTatTab && (
          <Col xs={24}>
            <div className={fieldRowClassName}>
              <div className="min-w-60 flex-[1_1_260px]">
                <Input
                  className={searchClassName}
                  prefix={<SearchOutlined />}
                  placeholder="Search by Deferral No, Customer..."
                  value={filters.searchText}
                  onChange={(e) =>
                    setFilters({ ...filters, searchText: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-[140px] flex-[1_1_140px]">
                <Input
                  className={searchClassName}
                  placeholder="Filter by Branch"
                  value={filters.branch}
                  onChange={(e) =>
                    setFilters({ ...filters, branch: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-[140px] flex-[1_1_140px]">
                <Input
                  className={searchClassName}
                  placeholder="Filter by Segment"
                  value={filters.segment}
                  onChange={(e) =>
                    setFilters({ ...filters, segment: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-[200px] flex-[1_1_200px]">
                <RangePicker
                  className={pickerClassName}
                  placeholder={["Start Date", "End Date"]}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                  size="middle"
                />
              </div>
              <div>
                <Button onClick={clearFilters} size="middle" className={buttonClassName}>
                  Clear
                </Button>
              </div>
            </div>
          </Col>
        )}

        {/* Right Section - DCL Filter */}
        {isDclTab && !isTatTab && (
          <Col xs={24}>
            <div className={fieldRowClassName}>
              <div className="min-w-60 flex-[1_1_320px]">
                <Input
                  className={searchClassName}
                  prefix={<SearchOutlined />}
                  placeholder="Search by DCL No, Customer..."
                  value={filters.searchText}
                  onChange={(e) =>
                    setFilters({ ...filters, searchText: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-[140px] flex-[1_1_140px]">
                <Input
                  className={searchClassName}
                  placeholder="Filter by Branch"
                  value={filters.branch}
                  onChange={(e) =>
                    setFilters({ ...filters, branch: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-[140px] flex-[1_1_140px]">
                <Input
                  className={searchClassName}
                  placeholder="Filter by Segment"
                  value={filters.segment}
                  onChange={(e) =>
                    setFilters({ ...filters, segment: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </div>
              <div className="min-w-60 flex-[1_1_260px]">
                <RangePicker
                  className={pickerClassName}
                  placeholder={["Start Date", "End Date"]}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                  size="middle"
                />
              </div>
              <div className="basis-[220px]">
                <Select
                  className={selectClassName}
                  placeholder="Filter by status"
                  value={filters.status}
                  onChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                  size="middle"
                >
                  <Option value="">All Statuses</Option>
                  {statusOptions.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <Button onClick={clearFilters} size="middle" className={buttonClassName}>
                  Clear
                </Button>
              </div>
            </div>
          </Col>
        )}
      </Row>
    </Card>
  );
}
