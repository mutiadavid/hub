import React from "react";
import { Progress, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "../../../styles/creatorDesignSystem.css";

const DocumentSummary = ({ documentCounts }) => {
  const cardFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
  const gray700 = "#374151";
  const progressPercent = 100;
  const completionRatio =
    documentCounts.total > 0
      ? `${documentCounts.total}/${documentCounts.total}`
      : "0/0";

  const statItems = [
    { label: "Total", value: documentCounts.total },
    { label: "Submitted", value: documentCounts.submitted },
    { label: "Waived", value: documentCounts.waived },
    { label: "Deferred", value: documentCounts.deferred },
    { label: "Sighted", value: documentCounts.sighted },
    { label: "TBO", value: documentCounts.tbo },
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
            gap: "6px 14px",
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
                fontFamily: cardFontFamily,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: gray700,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
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
            marginBottom: 4,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: gray700, fontWeight: 500, fontFamily: cardFontFamily }}>
              Completion Progress
            </span>
            <Tooltip
              title={`${documentCounts.total} completed out of ${documentCounts.total} total documents.`}
            >
              <InfoCircleOutlined style={{ color: gray700, cursor: "help", fontSize: 12 }} />
            </Tooltip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: gray700, fontFamily: cardFontFamily }}>
              {progressPercent}%
            </span>
            <span style={{ fontSize: 12, color: gray700, fontWeight: 500, fontFamily: cardFontFamily }}>
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
          strokeWidth={6}
          status="success"
        />
      </div>
    </section>
  );
};

export default DocumentSummary;
