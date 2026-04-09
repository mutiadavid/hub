import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, Row, Col, Empty, Spin } from "antd";
import { generateChartData } from "../../utils/reportGenerator";

const COLORS = [
  "#164679",
  "#b5d334",
  "#faad14",
  "#ff4d4f",
  "#52c41a",
  "#1890ff",
  "#ff7a45",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
];

const ReportCharts = ({ data, reportType, isLoading }) => {
  const chartData = useMemo(
    () => generateChartData(data, reportType),
    [data, reportType]
  );

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <Empty description="No data available for charts" />;
  }

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]}>
        {/* Status Distribution */}
        <Col xs={24} sm={24} md={12}>
          <Card
            title="Status Distribution"
            size="small"
            style={{ height: "100%" }}
          >
            {chartData.statusChart && chartData.statusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data" />
            )}
          </Card>
        </Col>

        {/* Priority/Loan Type Distribution */}
        <Col xs={24} sm={24} md={12}>
          <Card
            title={reportType === "deferrals" ? "Priority Distribution" : "Loan Type Distribution"}
            size="small"
            style={{ height: "100%" }}
          >
            {(reportType === "deferrals"
              ? chartData.priorityChart
              : chartData.loanTypeChart) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    reportType === "deferrals"
                      ? chartData.priorityChart
                      : chartData.loanTypeChart
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#164679" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data" />
            )}
          </Card>
        </Col>

        {/* Approval Status (Deferrals only) */}
        {reportType === "deferrals" && (
          <Col xs={24} sm={24} md={12}>
            <Card title="Approval Status" size="small" style={{ height: "100%" }}>
              {chartData.approvalChart && chartData.approvalChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.approvalChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#52c41a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data" />
              )}
            </Card>
          </Col>
        )}

        {/* Days Remaining (Deferrals only) */}
        {reportType === "deferrals" && (
          <Col xs={24} sm={24} md={12}>
            <Card
              title="Days Remaining by Deferral"
              size="small"
              style={{ height: "100%" }}
            >
              {chartData.daysRemainingChartData &&
              chartData.daysRemainingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.daysRemainingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="daysRemaining"
                      stroke="#faad14"
                      strokeWidth={2}
                      dot={{ fill: "#faad14" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data" />
              )}
            </Card>
          </Col>
        )}

        {/* Documents Distribution (DCLs only) */}
        {reportType === "allDCLs" && (
          <Col xs={24} sm={24} md={12}>
            <Card
              title="Documents by DCL"
              size="small"
              style={{ height: "100%" }}
            >
              {chartData.docCountChartData && chartData.docCountChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.docCountChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="documents" fill="#1890ff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data" />
              )}
            </Card>
          </Col>
        )}

        {/* RM Distribution */}
        <Col xs={24} sm={24} md={12}>
          <Card title="Assignments by RM" size="small" style={{ height: "100%" }}>
            {chartData.rmChart && chartData.rmChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.rmChart}
                  layout="vertical"
                  margin={{ left: 150 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#722ed1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data" />
            )}
          </Card>
        </Col>

        {/* Creator Distribution (DCLs only) */}
        {reportType === "allDCLs" && (
          <Col xs={24} sm={24} md={12}>
            <Card title="Submissions by Creator" size="small" style={{ height: "100%" }}>
              {chartData.creatorChart && chartData.creatorChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData.creatorChart}
                    layout="vertical"
                    margin={{ left: 150 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={140} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#13c2c2" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data" />
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ReportCharts;
