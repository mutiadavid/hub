import React from "react";
import { Card, Row, Col, Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { PRIMARY_BLUE } from "../utils/constants";

/**
 * DeferralFilters Component
 * Search and filter controls for deferrals
 */
const DeferralFilters = ({
  searchText = "",
  onSearchChange,
  onClearFilters,
}) => {
  return (
    <Card
      style={{
        marginBottom: 16,
        background: "#fafafa",
        border: `1px solid ${PRIMARY_BLUE}20`,
        borderRadius: 8,
      }}
      size="small"
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search by Deferral No, DCL No, Customer, Loan Type, or Document"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
            size="middle"
          />
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Button
            onClick={onClearFilters}
            style={{ width: "100%" }}
            size="middle"
          >
            Clear Filters
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default DeferralFilters;
