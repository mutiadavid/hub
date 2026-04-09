import React from "react";
import { Skeleton } from "antd";

const DeferralStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="checker-stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="checker-stats-card">
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { key: "total", label: "Total Deferrals", value: stats?.total || 0 },
    { key: "pending", label: "Pending", value: stats?.pending || 0 },
    { key: "approved", label: "Approved", value: stats?.approved || 0 },
    { key: "rejected", label: "Rejected", value: stats?.rejected || 0 },
  ];

  return (
    <div className="checker-stats-grid">
      {cards.map((card) => (
        <div key={card.key} className="checker-stats-card">
          <div className="checker-stats-card__label">{card.label}</div>
          <div className="checker-stats-card__value">{card.value}</div>
        </div>
      ))}
    </div>
  );
};

export default DeferralStats;
