import React from "react";
import { Tag } from "antd";
import { getChecklistTimingMetrics } from "../../../utils/checklistUtils";
import "../../../styles/creatorDesignSystem.css";

const getStatusVariant = (status) => {
  const normalized = (status || "").toLowerCase();

  if (normalized.includes("approved")) return "approved";
  if (normalized.includes("rejected")) return "rework";
  if (normalized.includes("pending")) return "pending";
  return "qs-review";
};

const ChecklistHeader = ({ checklist }) => {
  const timing = getChecklistTimingMetrics(checklist);
  const cardFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
  const gray700 = "#374151";

  const rows = [
    { label: "DCL No", value: checklist.dclNo || "-" },
    { label: "IBPS No", value: checklist.ibpsNo || "Not provided" },
    { label: "Date Created", value: timing.createdAtLabel },
    { label: "Queued Before Forward", value: timing.queueDurationLabel },
    { label: "Workflow Turnaround", value: timing.lifecycleDurationLabel },
    { label: "Loan Type", value: checklist.loanType || "-" },
    { label: "Created By", value: checklist.createdBy?.name || "-" },
    { label: "RM", value: checklist.assignedToRM?.name || "Not assigned" },
    {
      label: "Co-Checker",
      value: checklist.assignedToCoChecker?.name || "Pending Assignment",
    },
  ];

  return (
    <section
      className="creator-card"
      style={{
        marginBottom: 16,
        fontFamily: cardFontFamily,
        fontSize: 12,
        borderRadius: 14,
        boxShadow: "0 10px 26px rgba(26, 54, 54, 0.08)",
      }}
    >
      <div
        className="creator-card__header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          fontSize: 12,
          fontFamily: cardFontFamily,
          color: gray700,
        }}
      >
        <span>Checklist Details</span>
        <span
          className={`creator-badge creator-badge--${getStatusVariant(checklist.status)}`}
          style={{ fontFamily: cardFontFamily, fontSize: 12, padding: "4px 12px" }}
        >
          {(checklist.status || "In Progress").replace(/_/g, " ")}
        </span>
      </div>
      <div
        className="creator-card__body"
        style={{ padding: 14, fontFamily: cardFontFamily, fontSize: 12 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {rows.map((item) => (
            <div key={item.label}>
              <div
                className="creator-label"
                style={{
                  fontSize: 12,
                  marginBottom: 4,
                  fontFamily: cardFontFamily,
                  letterSpacing: "0.01em",
                  color: gray700,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: gray700,
                  minHeight: 20,
                  lineHeight: 1.3,
                  fontFamily: cardFontFamily,
                }}
              >
                {item.label === "Loan Type" ? (
                  <Tag
                    style={{
                      margin: 0,
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: 12,
                      lineHeight: 1.4,
                      fontFamily: cardFontFamily,
                      color: gray700,
                    }}
                  >
                    {item.value}
                  </Tag>
                ) : (
                  item.value
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChecklistHeader;
