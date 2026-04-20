import React from "react";
import { Tag } from "antd";
import { getChecklistTimingMetrics } from "../../../utils/checklistUtils";
import { getChecklistBaseInfoRows } from "../shared/checklistInfoRows";
import "../../../styles/creatorDesignSystem.css";

const ChecklistDetails = ({ checklist }) => {
  const timing = getChecklistTimingMetrics(checklist);

  const rows = [
    ...getChecklistBaseInfoRows({
      checklist,
      timing,
      createdByFallback: "N/A",
      rmFallback: "N/A",
      coCheckerFallback: "Pending Assignment",
    }),
    {
      label: "Current Status",
      value: checklist?.status?.replace(/_/g, " ") || "Unknown",
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
