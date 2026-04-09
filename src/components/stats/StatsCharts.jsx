import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const colors = ["#1f6feb", "#5b7083", "#98a2b3"];

function SimpleCard({ title, children }) {
  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 6,
        background: "#fff",
      }}
    >
      <strong>{title}</strong>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

export default function StatsCharts({
  dclCounts = [],
  deferralCounts = [],
  loading = false,
}) {
  if (loading) return <div>Loading charts...</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <SimpleCard title="DCLs by status">
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart
              data={dclCounts}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SimpleCard>

      <SimpleCard title="Deferrals by stage/status">
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={deferralCounts}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {deferralCounts.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </SimpleCard>
    </div>
  );
}
