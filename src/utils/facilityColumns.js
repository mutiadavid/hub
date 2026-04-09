import React from "react";
import { Typography } from "antd";
const { Text } = Typography;

// Centralized facility columns used across deferral modals
export default function getFacilityColumns() {
  const PRIMARY_BLUE = "#164679";
  const SUCCESS_GREEN = "#52c41a";

  return [
    {
      title: "Facility Type",
      dataIndex: "facilityType",
      key: "facilityType",
      render: (t, record) => React.createElement(Text, { strong: true }, t || record.type || record.name || "N/A"),
    },
    {
      title: "Sanctioned (KES '000)",
      dataIndex: "sanctioned",
      key: "sanctioned",
      render: (v, r) => {
        const val = v ?? r.amount ?? 0;
        return Number(val || 0).toLocaleString();
      },
    },
    {
      title: "Balance (KES '000)",
      dataIndex: "balance",
      key: "balance",
      render: (v, r) => Number(v ?? r.balance ?? 0).toLocaleString(),
    },
    {
      title: "Headroom (KES '000)",
      dataIndex: "headroom",
      key: "headroom",
      render: (v, r) =>
        Number(
          v ?? r.headroom ?? Math.max(0, (r.amount || 0) - (r.balance || 0)),
        ).toLocaleString(),
    },
  ];
}
