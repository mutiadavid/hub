import React from "react";
import { Skeleton } from "antd";

const DeferralStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[rgba(214,189,152,0.18)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          >
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-[rgba(214,189,152,0.18)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
        >
          <div className="text-[11px] font-semibold tracking-[0.08em] text-(--color-text-light) uppercase">
            {card.label}
          </div>
          <div className="mt-2 text-[28px] leading-none font-semibold tracking-[-0.03em] text-(--color-text-dark)">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeferralStats;
