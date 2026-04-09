import React from "react";
import { Tag } from "antd";
import { getChecklistTimingMetrics } from "../../../utils/checklistUtils";
import "../../../styles/creatorDesignSystem.css";

const ChecklistDetails = ({ checklist }) => {
  const timing = getChecklistTimingMetrics(checklist);

  const rows = [
    { label: "DCL No", value: checklist?.dclNo || "N/A" },
    { label: "IBPS No", value: checklist?.ibpsNo || "Not provided" },
    { label: "Date Created", value: timing.createdAtLabel },
    { label: "Queued Before Forward", value: timing.queueDurationLabel },
    { label: "Workflow Turnaround", value: timing.lifecycleDurationLabel },
    { label: "Loan Type", value: checklist?.loanType || "N/A" },
    { label: "Created By", value: checklist?.createdBy?.name || "N/A" },
    { label: "RM", value: checklist?.assignedToRM?.name || "N/A" },
    {
      label: "Current Status",
      value: checklist?.status?.replace(/_/g, " ") || "Unknown",
      tag: true,
    },
    {
      label: "Co-Checker",
      value: checklist?.assignedToCoChecker?.name || "Pending Assignment",
      tag: true,
    },
    { label: "Customer Number", value: checklist?.customerNumber || "N/A" },
  ];

  return (
    <section className="creator-card" style={{ marginBottom: 0 }}>
      <div className="creator-card__header">Checklist Details</div>
      <div className="creator-card__body" style={{ padding: 12 }}>
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
                style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: "var(--color-text-medium)",
                  minHeight: 18,
                  lineHeight: 1.35,
                }}
              >
                {item.tag ? (
                  <Tag style={{ margin: 0 }}>{item.value}</Tag>
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

export default ChecklistDetails;
