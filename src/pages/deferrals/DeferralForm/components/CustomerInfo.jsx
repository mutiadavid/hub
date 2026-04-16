import React from "react";
import {
  Card,
  Descriptions,
  Typography,
} from "antd";
import { getStatusColor, formatStatusText } from "../../../../utils/statusColors";
import { PRIMARY_BLUE, PRIMARY_PURPLE, SECONDARY_BLUE } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

export default function CustomerInfo({
  customerName,
  customerNumber,
  dclNumber,
  selectedChecklistStatus,
  loanType,
  formatLoanType,
}) {
  const dclStatusColor = selectedChecklistStatus
    ? getStatusColor(selectedChecklistStatus).textColor
    : "#595959";

  return (
    <>
      <style>{`
        .deferral-form-customer-card.ant-card {
          margin-bottom: 20px;
          border-radius: 10px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06) !important;
          overflow: hidden;
        }
        .deferral-form-customer-card .ant-card-head {
          background: var(--color-bg) !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
          min-height: 52px;
          padding: 0 16px !important;
        }
        .deferral-form-customer-card .ant-card-head-title {
          padding: 14px 0 !important;
        }
        .deferral-form-customer-card .ant-card-body {
          padding: 16px !important;
        }
        .deferral-form-customer-card .ant-descriptions-view {
          border: 1px solid rgba(214, 189, 152, 0.16);
          border-radius: 8px;
          overflow: hidden;
        }
        .deferral-form-customer-card .ant-descriptions-item-label {
          background: rgba(245, 247, 244, 0.9) !important;
          color: var(--color-text-light) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .deferral-form-customer-card .ant-descriptions-item-content {
          background: var(--color-white) !important;
        }
        .deferral-form-section-title {
          color: #164679;
          font-size: 18px;
          font-weight: 700;
          font-family: inherit;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.3;
        }
      `}</style>
    <Card
      className="deferral-form-customer-card"
      size="small"
      title={
        <div className="deferral-form-section-title">Customer Information</div>
      }
    >
      <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
        <Descriptions.Item label="Customer Name">
          <Typography.Text strong style={{ color: PRIMARY_PURPLE }}>
            {customerName}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Customer Number">
          <Typography.Text strong style={{ color: PRIMARY_BLUE }}>
            {customerNumber}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="DCL No">
          <Typography.Text strong style={{ color: SECONDARY_BLUE }}>
            {dclNumber || "Not entered"}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          <div>
            <Typography.Text strong style={{ color: PRIMARY_PURPLE }}>
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
              {new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography.Text>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="DCL Status">
          <div style={{ display: "flex", alignItems: "center" }}>
            <Typography.Text strong style={{ color: dclStatusColor }}>
              {selectedChecklistStatus
                ? formatStatusText(selectedChecklistStatus)
                : "Pending"}
            </Typography.Text>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Loan Type">
          <Typography.Text strong style={{ color: SECONDARY_BLUE }}>
            {formatLoanType(loanType)}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
    </>
  );
}