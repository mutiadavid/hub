import React, { useMemo } from "react";
import { Card, Col, Empty, Row, Typography } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";
import { buildTATAnalytics, formatNumber } from "./reportUtils";
import { NCBA_REPORT_THEME, REPORT_COLOR_PALETTES } from "./reportTheme";
import useReportNow from "./useReportNow";

const { Text } = Typography;

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  border: `1px solid ${NCBA_REPORT_THEME.line}`,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(36, 26, 23, 0.08)",
  padding: "10px 12px",
};

const getShareLabel = (value, total) => {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

const TAT_BUCKET_COLORS = {
  "Excellent (≤7 days)": REPORT_COLOR_PALETTES.citrus[0],
  "Good (8-14 days)": REPORT_COLOR_PALETTES.ocean[0],
  "Average (15-21 days)": REPORT_COLOR_PALETTES.amber[0],
  "Slow (22-30 days)": REPORT_COLOR_PALETTES.plum[0],
  "Very Slow (>30 days)": REPORT_COLOR_PALETTES.cocoa[1],
};

export default function TATConsumedDashboard({ deferralRows = [], dclRows = [] }) {
  const now = useReportNow();
  const computed = useMemo(() => buildTATAnalytics(deferralRows, dclRows, now), [deferralRows, dclRows, now]);
  const metricCards = [
    { label: "Processed Items", value: computed.totalItems, suffix: "", note: "DCL and Deferral records in scope" },
    { label: "Total TAT Consumed", value: computed.totalTATConsumed, suffix: "d", note: "Accumulated end-to-end TAT" },
    { label: "Avg RM TAT", value: computed.averageRmTat, suffix: "d", note: "Creation to RM completion" },
    { label: "Avg CO Creator TAT", value: computed.averageCoCreatorTat, suffix: "d", note: "RM handoff to CO Creator completion" },
    { label: "Avg CO Checker TAT", value: computed.averageCoCheckerTat, suffix: "d", note: "CO Creator handoff to final action" },
    { label: "Avg Total TAT", value: computed.averageTAT, suffix: "d", note: "Creation to final approval" },
  ];

  if (!deferralRows.length && !dclRows.length) {
    return (
      <Empty
        description="No TAT data available for the selected filters"
        style={{ marginTop: 24 }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        {metricCards.map((card) => (
          <Col key={card.label} xs={24} md={12} xl={8}>
            <Card size="small" style={{ borderRadius: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {card.label}
                </Text>
                <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                  {formatNumber(card.value)}{card.suffix}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {card.note}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="TAT Distribution by Category" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 300 }}>
              {computed.tatBucketData && computed.tatBucketData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={computed.tatBucketData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={48}
                      paddingAngle={2}
                      label={({ value, percent }) => (percent >= 0.08 ? `${value} (${(percent * 100).toFixed(0)}%)` : "")}
                    >
                      {computed.tatBucketData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={TAT_BUCKET_COLORS[entry.name] || NCBA_REPORT_THEME.brandSoft}
                        />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={48}
                      formatter={(value, entry) => `${value} (${entry?.payload?.value || 0})`}
                    />
                    <RechartsTooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, _name, item) => [
                        `${formatNumber(value)} items (${getShareLabel(Number(value), computed.totalItems)})`,
                        item?.payload?.name || "Bucket",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data" />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="Stage TAT Comparison" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 300 }}>
              {computed.stageComparisonData && computed.stageComparisonData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={computed.stageComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis label={{ value: "Average TAT (days)", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [`${Number(value).toFixed(2)} days`, name]}
                    />
                    <Legend />
                    <Bar dataKey="DCL" fill={REPORT_COLOR_PALETTES.cocoa[1]} name="DCL" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="DCL" position="top" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} formatter={(value) => Number(value).toFixed(1)} />
                    </Bar>
                    <Bar dataKey="Deferral" fill={REPORT_COLOR_PALETTES.ocean[0]} name="Deferral" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="Deferral" position="top" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} formatter={(value) => Number(value).toFixed(1)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data" />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Average Total TAT Trend Over Time" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 300 }}>
              {computed.tatTrendData && computed.tatTrendData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={computed.tatTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      style={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis label={{ value: "Average TAT (days)", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => {
                        if (name === "dclAvgTat") return [`${value} days`, "DCL Avg TAT"];
                        if (name === "deferralAvgTat") return [`${value} days`, "Deferral Avg TAT"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="dclAvgTat"
                      stroke={REPORT_COLOR_PALETTES.cocoa[1]}
                      strokeWidth={2}
                      dot={{ fill: REPORT_COLOR_PALETTES.cocoa[1], r: 4 }}
                      activeDot={{ r: 6 }}
                      name="DCL Avg TAT"
                    />
                    <Line
                      type="monotone"
                      dataKey="deferralAvgTat"
                      stroke={REPORT_COLOR_PALETTES.ocean[0]}
                      strokeWidth={2}
                      dot={{ fill: REPORT_COLOR_PALETTES.ocean[0], r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Deferral Avg TAT"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No trend data" />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Type Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Average Total TAT by Workflow" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 250 }}>
              {computed.totalComparisonData && computed.totalComparisonData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={computed.totalComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Average TAT (days)", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, _name, item) => [`${Number(value).toFixed(2)} days`, `${item?.payload?.name || "Workflow"} Avg Total TAT`]}
                    />
                    <Bar dataKey="avgTotalTat" fill={REPORT_COLOR_PALETTES.amber[0]} radius={[6, 6, 0, 0]} name="Avg Total TAT">
                      <LabelList dataKey="avgTotalTat" position="top" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} formatter={(value) => Number(value).toFixed(1)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data" />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="Summary Statistics" size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(214, 189, 152, 0.2)" }}>
                <Text type="secondary">Deferral Count</Text>
                <Text strong>{computed.deferralMetrics.count}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(214, 189, 152, 0.2)" }}>
                <Text type="secondary">Deferral Avg Total TAT</Text>
                <Text strong>{formatNumber(computed.deferralMetrics.averageTAT)} days</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(214, 189, 152, 0.2)" }}>
                <Text type="secondary">Deferral Avg RM / CO Creator / CO Checker</Text>
                <Text strong>
                  {formatNumber(computed.deferralMetrics.averageRmTat)} / {formatNumber(computed.deferralMetrics.averageCoCreatorTat)} / {formatNumber(computed.deferralMetrics.averageCoCheckerTat)} days
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(214, 189, 152, 0.2)" }}>
                <Text type="secondary">DCL Count</Text>
                <Text strong>{computed.dclMetrics.count}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(214, 189, 152, 0.2)" }}>
                <Text type="secondary">DCL Avg Total TAT</Text>
                <Text strong>{formatNumber(computed.dclMetrics.averageTAT)} days</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">DCL Avg RM / CO Creator / CO Checker</Text>
                <Text strong>
                  {formatNumber(computed.dclMetrics.averageRmTat)} / {formatNumber(computed.dclMetrics.averageCoCreatorTat)} / {formatNumber(computed.dclMetrics.averageCoCheckerTat)} days
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
