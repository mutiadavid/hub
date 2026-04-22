import React from "react";
import {
  Card,
  Descriptions,
  Typography,
} from "antd";
import { getStatusColor, formatStatusText } from "../../../../utils/statusColors";
import "../../../../styles/creatorDesignSystem.css";
import "../../../../styles/deferralFormGlobalStyles.css";

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
          /* Uses global form-descriptions-label from deferralFormGlobalStyles.css */
          background: rgba(245, 247, 244, 0.9) !important;
          color: var(--color-text-light) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .deferral-form-customer-card .ant-descriptions-item-content {
          background: var(--color-white) !important;
        }
        .deferral-form-section-title {
          /* Uses global form-section-title from deferralFormGlobalStyles.css */
        }
      `}</style>
    <Card
      className="deferral-form-customer-card"
      size="small"
      title={
        <div className="deferral-form-section-title form-section-title">Customer Information</div>
      }
    >
      <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
        <Descriptions.Item label="Customer Name">
          <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 400 }}>
            {customerName}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Customer Number">
          <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 400 }}>
            {customerNumber}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="DCL No">
          <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 400 }}>
            {dclNumber || "Not entered"}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          <div>
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 400 }}>
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
            <Typography.Text style={{ color: dclStatusColor, fontWeight: 400 }}>
              {selectedChecklistStatus
                ? formatStatusText(selectedChecklistStatus)
                : "Pending"}
            </Typography.Text>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Loan Type">
          <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 400 }}>
            {formatLoanType(loanType)}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
    </>
  );
}