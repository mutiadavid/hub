import React from "react";
import { Progress } from "antd";
import { calculateDocumentStats } from "../../../utils/documentUtils";
import "../../../styles/creatorDesignSystem.css";

const ProgressStatsSection = ({ docs }) => {
  const documentStats = calculateDocumentStats(docs);
  const cardFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
  const gray700 = "#374151";
  const {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
    progressPercent,
  } = documentStats;

  const stats = [
    { label: "Total", value: total },
    { label: "Submitted", value: submitted },
    { label: "Pending RM", value: pendingFromRM },
    { label: "Pending Co", value: pendingFromCo },
    { label: "Deferred", value: deferred },
    { label: "Sighted", value: sighted },
    { label: "Waived", value: waived },
    { label: "TBO", value: tbo },
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
        style={{ padding: "10px 14px", fontSize: 12, fontFamily: cardFontFamily, color: gray700 }}
      >
        Progress
      </div>
      <div className="creator-card__body" style={{ display: "flex", flexDirection: "column", gap: 14, padding: 14, fontFamily: cardFontFamily, fontSize: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", fontSize: 12, color: gray700 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ fontWeight: 500, fontFamily: cardFontFamily }}>
              {stat.label}: <span style={{ color: gray700, fontWeight: 700 }}>{stat.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="creator-label" style={{ marginBottom: 0, fontSize: 12, color: gray700, fontFamily: cardFontFamily }}>Completion Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: gray700, fontFamily: cardFontFamily }}>
              {progressPercent}%
            </span>
          </div>
          <Progress
            percent={progressPercent}
            showInfo={false}
            strokeColor="var(--color-primary-dark)"
            trailColor="rgba(214, 189, 152, 0.14)"
            strokeWidth={6}
          />
        </div>
      </div>
    </section>
  );
};

export default ProgressStatsSection;
