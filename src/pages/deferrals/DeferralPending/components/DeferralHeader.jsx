import React from "react";
import { Card, Row, Col, Button, Badge } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { PRIMARY_BLUE, ACCENT_LIME } from "../utils/constants";

/**
 * DeferralHeader Component
 * Displays the page header with title, count badge, and action buttons
 */
const DeferralHeader = ({
  filteredDataLength = 0,
  onNewDeferral,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${ACCENT_LIME}`,
      }}
      styles={{ body: { padding: 16 } }}
    >
      <Row justify="space-between" align="middle">
        <Col>
          <h2
            style={{
              margin: 0,
              color: PRIMARY_BLUE,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            My Deferral Requests
            <Badge
              count={filteredDataLength}
              style={{
                backgroundColor: ACCENT_LIME,
                fontSize: 12,
              }}
            />
          </h2>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
            Track and manage your deferral requests
          </p>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={onNewDeferral}
            style={{
              backgroundColor: `${PRIMARY_BLUE} !important`,
              borderColor: `${PRIMARY_BLUE} !important`,
              color: "#ffffff !important",
            }}
            icon={<PlusOutlined />}
          >
            New Deferral Request
          </Button>
          <Button
            onClick={onRefresh}
            loading={isLoading}
            icon={<ReloadOutlined />}
            title="Refresh deferrals list"
            style={{ marginLeft: 8 }}
          >
            Refresh
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default DeferralHeader;
