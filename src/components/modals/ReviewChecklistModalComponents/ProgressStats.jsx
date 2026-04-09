import React from "react";
import { Progress, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useDocumentStats } from "../../../hooks/useDocumentStats";
import "../../../styles/creatorDesignSystem.css";

const ProgressStats = ({ docs }) => {
  const stats = useDocumentStats(docs);
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
    completedDocs,
  } = stats;

  // Calculate completion ratio
  const completionRatio = total > 0 ? `${completedDocs}/${total}` : "0/0";

  const statItems = [
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
      <div
        className="creator-card__body"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 14,
          fontFamily: cardFontFamily,
          fontSize: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            alignItems: "center",
          }}
        >
          {statItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 6,
                minWidth: "fit-content",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: gray700,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  fontFamily: cardFontFamily,
                }}
              >
                {item.label}:
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: gray700,
                  whiteSpace: "nowrap",
                  fontFamily: cardFontFamily,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: gray700,
                fontWeight: 500,
                fontFamily: cardFontFamily,
              }}
            >
              Completion Progress
            </span>
            <Tooltip
              title={`${completedDocs} completed out of ${total} total documents. Pending documents reduce progress.`}
            >
              <InfoCircleOutlined
                style={{ color: gray700, cursor: "help", fontSize: 12 }}
              />
            </Tooltip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: gray700,
                fontFamily: cardFontFamily,
              }}
            >
              {progressPercent}%
            </span>
            <span
              style={{
                fontSize: 12,
                color: gray700,
                fontWeight: 500,
                fontFamily: cardFontFamily,
              }}
            >
              ({completionRatio})
            </span>
          </div>
        </div>

        <Progress
          percent={progressPercent}
          strokeColor={{
            "0%": "#1A3636",
            "100%": "#40534C",
          }}
          strokeWidth={8}
          status={progressPercent < 100 ? "active" : "success"}
        />
      </div>
    </section>
  );
};

export default ProgressStats;
