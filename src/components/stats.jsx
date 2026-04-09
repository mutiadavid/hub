import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

import { Card, Row, Col, Typography } from "antd";

const { Title, Text } = Typography;

// ------------------ Mocked Data ------------------
const monthlyChecklistStats = [
  { month: "Jan", Completed: 120, Pending: 40, Deferred: 20 },
  { month: "Feb", Completed: 150, Pending: 60, Deferred: 15 },
  { month: "Mar", Completed: 200, Pending: 55, Deferred: 35 },
  { month: "Apr", Completed: 180, Pending: 50, Deferred: 20 },
  { month: "May", Completed: 240, Pending: 70, Deferred: 30 },
];

const pieData = [
  { name: "Completed", value: 420 },
  { name: "Pending", value: 180 },
  { name: "Deferred", value: 95 },
];

const COLORS = ["#3A2A82", "#C8A854", "#FF6B3D"]; // NCBA purple + gold + alert orange

// ------------------ Component ------------------
const CombinedCharts = () => {
  return (
    <div style={{ padding: 20 }}>
      {/* KPI CARDS */}
      <Row gutter={16} style={{ marginBottom: 30 }}>
        <Col span={8}>
          <Card
            style={{
              borderLeft: "5px solid #3A2A82",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <Text type="secondary">Total Checklists</Text>
            <Title level={3} style={{ margin: 0 }}>
              695
            </Title>
            <Text strong style={{ color: "#3A2A82" }}>
              +12% this month
            </Text>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{
              borderLeft: "5px solid #C8A854",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <Text type="secondary">Pending Checklists</Text>
            <Title level={3} style={{ margin: 0 }}>
              180
            </Title>
            <Text strong style={{ color: "#C8A854" }}>
              RM follow-up required
            </Text>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{
              borderLeft: "5px solid #FF6B3D",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <Text type="secondary">Deferred Requests</Text>
            <Title level={3} style={{ margin: 0 }}>
              95
            </Title>
            <Text strong style={{ color: "#FF6B3D" }}>
              Awaiting additional docs
            </Text>
          </Card>
        </Col>
      </Row>

      {/* TWO MAIN CHARTS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "30px",
        }}
      >
        {/* AREA CHART — Submission Trend */}
        <div
          style={{
            flex: 1,
            minWidth: 350,
            height: 380,
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ textAlign: "center", color: "#3A2A82" }}>
            Monthly Checklist Workflow Trend
          </h3>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyChecklistStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Area
                type="monotone"
                dataKey="Completed"
                stackId="1"
                stroke="#3A2A82"
                fill="#3A2A82"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="Pending"
                stackId="1"
                stroke="#C8A854"
                fill="#C8A854"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="Deferred"
                stackId="1"
                stroke="#FF6B3D"
                fill="#FF6B3D"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART — Status Breakdown */}
        <div
          style={{
            flex: 1,
            minWidth: 350,
            height: 380,
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ textAlign: "center", color: "#3A2A82" }}>
            Checklist Status Breakdown
          </h3>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BAR CHART — RM Performance */}
      <div
        style={{
          marginTop: 40,
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
          height: 380,
        }}
      >
        <h3 style={{ textAlign: "center", color: "#3A2A82" }}>
          RM Checklist Performance Overview
        </h3>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              { name: "Alice", Completed: 140, Pending: 30, Deferred: 10 },
              { name: "Bob", Completed: 90, Pending: 50, Deferred: 20 },
              { name: "Brian", Completed: 160, Pending: 40, Deferred: 15 },
              { name: "Sarah", Completed: 130, Pending: 60, Deferred: 25 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Bar dataKey="Completed" fill="#3A2A82" />
            <Bar dataKey="Pending" fill="#C8A854" />
            <Bar dataKey="Deferred" fill="#FF6B3D" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CombinedCharts;
