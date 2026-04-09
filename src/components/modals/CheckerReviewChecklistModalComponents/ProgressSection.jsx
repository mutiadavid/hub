import React from "react";
import { Progress, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "../../../styles/creatorDesignSystem.css";

const ProgressSection = ({ documentStats, total }) => {
  const {
    total: docTotal,
    submitted,
    deferred,
    sighted,
    waived,
    tbo,
  } = documentStats;

  const totalDocuments = docTotal || total || 1;

  // Calculate completion ratio
  const completedDocs =
    (submitted || 0) +
    (sighted || 0) +
    (waived || 0) +
    (tbo || 0) +
    (deferred || 0);
  const completionRatio =
    totalDocuments > 0 ? `${completedDocs}/${totalDocuments}` : "0/0";

  // Calculate progress percent
  const progressPercent =
    totalDocuments > 0 ? Math.round((completedDocs / totalDocuments) * 100) : 0;

  return (
    <section className="creator-card" style={{ marginBottom: 0 }}>
      <div className="creator-card__header">Progress</div>
      <div
        className="creator-card__body"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 12,
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
            ["Total", totalDocuments],
            ["Submitted", submitted],
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
                  fontSize: 11,
                  color: "var(--color-text-light)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {label}:
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--color-text-dark)",
                  whiteSpace: "nowrap",
                }}
              >
                {value || 0}
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
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-medium)",
                fontWeight: 500,
              }}
            >
              Completion Progress
            </span>
            <Tooltip
              title={`${completedDocs} completed out of ${totalDocuments} total documents. Pending documents reduce progress.`}
            >
              <InfoCircleOutlined
                style={{
                  color: "var(--color-primary-dark)",
                  cursor: "help",
                  fontSize: 12,
                }}
              />
            </Tooltip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--color-text-dark)",
              }}
            >
              {progressPercent}%
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-light)",
                fontWeight: 500,
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
            strokeWidth={6}
            status={progressPercent < 100 ? "active" : "success"}
          />
        </div>
      </div>
    </section>
  );
};

export default ProgressSection;
