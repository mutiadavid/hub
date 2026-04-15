import React from "react";
import { Card, Row, Col, Input, DatePicker, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

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
    <Card
      className="creator-reports-filters-card"
      size="small"
      bodyStyle={{ padding: "16px" }}
      style={{
        marginBottom: 0,
        background: "var(--color-white)",
        borderRadius: 8,
        border: "1px solid rgba(214, 189, 152, 0.2)",
        boxShadow: "0 1px 2px rgba(26, 54, 54, 0.06)",
      }}
    >
      <style>{`
        .creator-reports-filters-card.ant-card .ant-card-body {
          padding: 16px !important;
        }
        .creator-reports-filters-card .ant-input-affix-wrapper,
        .creator-reports-filters-card .ant-picker,
        .creator-reports-filters-card .ant-select .ant-select-selector {
          min-height: 40px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: none !important;
          background: var(--color-white) !important;
        }
        .creator-reports-filters-card .ant-input-affix-wrapper:hover,
        .creator-reports-filters-card .ant-input-affix-wrapper-focused,
        .creator-reports-filters-card .ant-picker:hover,
        .creator-reports-filters-card .ant-picker-focused,
        .creator-reports-filters-card .ant-select-focused .ant-select-selector,
        .creator-reports-filters-card .ant-select:hover .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
        }
        .creator-reports-filters-card .ant-input,
        .creator-reports-filters-card .ant-picker input,
        .creator-reports-filters-card .ant-select-selection-item,
        .creator-reports-filters-card .ant-select-selection-placeholder {
          font-size: 12px !important;
          color: var(--color-text-medium) !important;
        }
        .creator-reports-filters-card .ant-btn {
          min-height: 40px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .creator-reports-filters-card .ant-btn:hover,
        .creator-reports-filters-card .ant-btn:focus {
          border-color: var(--color-primary-dark) !important;
          color: var(--color-primary-dark) !important;
        }
      `}</style>
      <Row gutter={[12, 12]} align="middle" wrap>
        {isTatTab && (
          <Col xs={24}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ flex: "1 1 260px", minWidth: 240 }}>
                <Input
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
              <div style={{ flex: "1 1 260px", minWidth: 240 }}>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["Start Date", "End Date"]}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                  size="middle"
                />
              </div>
              <div style={{ flex: "0 0 220px" }}>
                <Select
                  style={{ width: "100%" }}
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
              <div style={{ flex: "0 0 180px" }}>
                <Select
                  style={{ width: "100%" }}
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
                <Button onClick={clearFilters} size="middle">
                  Clear
                </Button>
              </div>
            </div>
          </Col>
        )}

        {/* Left Section - Deferral Filter */}
        {isDeferralTab && !isTatTab && (
          <Col xs={24} sm={14} md={10} lg={9}>
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Start Date", "End Date"]}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              size="middle"
            />
          </Col>
        )}

        {/* Right Section - DCL Filter */}
        {isDclTab && !isTatTab && (
          <Col xs={24}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ flex: "1 1 320px", minWidth: 240 }}>
                <Input
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
              <div style={{ flex: "0 0 220px" }}>
                <Select
                  style={{ width: "100%" }}
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
                <Button onClick={clearFilters} size="middle">
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
