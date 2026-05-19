import React, { useMemo } from "react";
import { Card, Col, Empty, Row, Typography } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip,
  ComposedChart,
  BarChart,
  Bar,
  LabelList,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { buildDeferralsAnalytics, formatNumber, formatPercent } from "./reportUtils";
import {
  DEFERRAL_BAR_COLORS,
  DEFERRAL_BUCKET_COLORS,
  DEFERRAL_LINE_COLORS,
  DEFERRAL_RISK_COLORS,
  DEFERRAL_STATUS_COLORS,
  NCBA_REPORT_THEME,
  PIE_COLORS,
  REPORT_COLOR_PALETTES,
} from "./reportTheme";

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

export default function DeferralsDashboard({ rows }) {
  const computed = useMemo(() => buildDeferralsAnalytics(rows), [rows]);

  if (!rows.length) {
    return (
      <Empty
        description="No live deferral data found for the selected filters"
        style={{ marginTop: 24 }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total Deferrals
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                {computed.total}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Portfolio currently in the reporting window
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Overdue Ratio
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                {formatPercent(computed.overdueRate)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {computed.overdueCount} cases are overdue today
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total Exposure
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                {formatNumber(computed.totalExposure)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Aggregate exposure across all reported deferrals
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Watch + NPL Exposure
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                {formatNumber(computed.watchAndNplExposure)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Avg. days sought: {computed.averageDaysSought.toFixed(1)} days
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Overdue Status Mix" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={computed.overduePieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ value, percent }) => (percent >= 0.08 ? `${value} (${(percent * 100).toFixed(0)}%)` : "")}
                  >
                    {computed.overduePieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={DEFERRAL_STATUS_COLORS[entry.name] || DEFERRAL_STATUS_COLORS.unknown}
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
                      `${formatNumber(value)} deferrals (${getShareLabel(Number(value), computed.total)})`,
                      item?.payload?.name || "Status",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="Overdue Bucket Trend" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={computed.overdueBucketChartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={NCBA_REPORT_THEME.line} />
                  <XAxis
                    dataKey="bucket"
                    angle={-18}
                    textAnchor="end"
                    interval={0}
                    height={64}
                    tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
                  <RechartsTooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, _name, item) => [
                      `${formatNumber(value)} deferrals (${item?.payload?.pct || 0}%)`,
                      item?.payload?.bucket || "Bucket",
                    ]}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={32}>
                    {computed.overdueBucketChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.bucket}-${index}`}
                        fill={DEFERRAL_BUCKET_COLORS[entry.bucket] || DEFERRAL_BUCKET_COLORS.unknown}
                      />
                    ))}
                    <LabelList dataKey="count" position="top" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Top Relationship Managers" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={computed.rmChartData} margin={{ top: 24, right: 16, left: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={NCBA_REPORT_THEME.line} />
                  <XAxis dataKey="rm" tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
                  <RechartsTooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, _name, item) => [
                      `${formatNumber(value)} deferrals (${getShareLabel(Number(value), computed.total)})`,
                      item?.payload?.rm || "Relationship Manager",
                    ]}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                    {computed.rmChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.rm}-${index}`}
                        fill={DEFERRAL_BAR_COLORS[index % DEFERRAL_BAR_COLORS.length]}
                      />
                    ))}
                    <LabelList dataKey="total" position="top" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="Top Deferred Items" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={computed.deferredItemChartData} margin={{ top: 24, right: 16, left: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={NCBA_REPORT_THEME.line} />
                  <XAxis dataKey="item" tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
                  <RechartsTooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, _name, item) => [
                      `${formatNumber(value)} deferrals (${getShareLabel(Number(value), computed.total)})`,
                      item?.payload?.item || "Deferred Item",
                    ]}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                    {computed.deferredItemChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.item}-${index}`}
                        fill={[
                          REPORT_COLOR_PALETTES.amber[0],
                          REPORT_COLOR_PALETTES.ocean[0],
                          REPORT_COLOR_PALETTES.plum[0],
                          REPORT_COLOR_PALETTES.citrus[0],
                          REPORT_COLOR_PALETTES.amber[2],
                        ][index % 5]}
                      />
                    ))}
                    <LabelList dataKey="total" position="top" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small" title="Portfolio Signal" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Text strong style={{ color: NCBA_REPORT_THEME.brandDeep }}>
                {computed.topRiskGroup?.group || "Stable mix"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Largest deferred category right now is {computed.topRiskGroup?.item || "not available"}.
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title="Operational Focus" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Text strong style={{ color: NCBA_REPORT_THEME.brandDeep }}>
                {computed.topRm?.rm || "No RM trend yet"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Highest volume RM with {computed.topRm?.total || 0} tracked deferrals in the current view.
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title="Collections Watch" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Text strong style={{ color: NCBA_REPORT_THEME.brandDeep }}>
                {computed.topOverdueBucket?.bucket || "No overdue bucket"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Largest ageing pocket contains {computed.topOverdueBucket?.count || 0} deferrals.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Text type="secondary">
        Live system data summarised for enterprise reporting, with exposure, ageing, ownership and item concentration in one compact view.
      </Text>
    </div>
  );
}