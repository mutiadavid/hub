import React from "react";
import { Tag } from "antd";
import { formatCommentTimestamp, getChecklistTimingMetrics } from "../../../utils/checklistUtils";
import { getChecklistBaseInfoRows } from "../shared/checklistInfoRows";
import "../../../styles/creatorDesignSystem.css";

const ChecklistInfoCard = ({ checklist }) => {
  if (!checklist) return null;

  const timing = getChecklistTimingMetrics(checklist);
  const cardFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
  const gray700 = "#374151";

  const getStatusVariant = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized.includes("approved") || normalized.includes("completed")) {
      return "approved";
    }

    if (normalized.includes("rejected")) {
      return "rework";
    }

    if (normalized.includes("pending")) {
      return "pending";
    }

    return "qs-review";
  };

  const rows = [
    ...getChecklistBaseInfoRows({
      checklist,
      timing,
      createdByFallback: "N/A",
      rmFallback: "Not assigned",
      coCheckerFallback: "Pending Assignment",
    }),
    {
      label: "Completed At",
      value: checklist.completedAt || checklist.updatedAt
        ? formatCommentTimestamp(checklist.completedAt || checklist.updatedAt)
        : "Not available",
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
          color: gray700,
          fontFamily: cardFontFamily,
        }}
      >
        <span>Checklist Details</span>
        <span
          className={`creator-badge creator-badge--${getStatusVariant(checklist.status)}`}
          style={{ fontFamily: cardFontFamily, fontSize: 12, padding: "4px 12px" }}
        >
          {(checklist.status || "Completed").replace(/_/g, " ")}
        </span>
      </div>
      <div className="creator-card__body" style={{ padding: 14, fontFamily: cardFontFamily, fontSize: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {rows.map((item) => (
            <div key={item.label}>
              <div
                className="creator-label"
                style={{ fontSize: 12, marginBottom: 4, color: gray700, fontFamily: cardFontFamily }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: gray700,
                  minHeight: 20,
                  lineHeight: 1.35,
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

export default ChecklistInfoCard;
