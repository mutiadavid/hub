import React from "react";
import { Progress, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "../../../styles/creatorDesignSystem.css";

const ProgressSummary = ({ documentStats }) => {
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
  } = documentStats;

  // Calculate completion ratio
  const completedDocs =
    (submitted || 0) +
    (sighted || 0) +
    (waived || 0) +
    (tbo || 0) +
    (deferred || 0);
  const completionRatio = total > 0 ? `${completedDocs}/${total}` : "0/0";

  // Calculate progress percent
  const progressPercent =
    total > 0 ? Math.round((completedDocs / total) * 100) : 0;

  return (
    <section
      className="creator-card"
      style={{
        marginBottom: 0,
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
          gap: "6px 14px",
          alignItems: "center",
        }}
      >
        {[
          ["Total", total],
          ["Submitted", submitted],
          ["Pending RM", pendingFromRM],
          ["Pending CO", pendingFromCo],
          ["Deferred", deferred],
          ["Sighted", sighted],
          ["Waived", waived],
          ["TBO", tbo],
        ].map(([label, value]) => (
          <div
            key={label}
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
              {label}:
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
              {value}
            </span>
          </div>
        ))}
      </div>

      <div>
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
              style={{ fontSize: 12, color: gray700, fontWeight: 500, fontFamily: cardFontFamily }}
            >
              Completion Progress
            </span>
            <Tooltip
              title={`${completedDocs} completed out of ${total} total documents. Pending documents reduce progress.`}
            >
              <InfoCircleOutlined
                style={{
                  color: gray700,
                  cursor: "help",
                  fontSize: 12,
                }}
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
              style={{ fontSize: 12, color: gray700, fontWeight: 500, fontFamily: cardFontFamily }}
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
      </div>
    </section>
  );
};

export default ProgressSummary;
