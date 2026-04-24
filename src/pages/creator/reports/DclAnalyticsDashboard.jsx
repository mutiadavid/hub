import React, { useMemo } from "react";
import { Card, Col, Empty, Row, Typography } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  LabelList,
  CartesianGrid,
  XAxis,
  YAxis,
  // Remove formatNumber from here - it doesn't exist in recharts
} from "recharts";

import { buildDclAnalytics } from "./reportUtils";
import { DCL_BAR_COLORS, DCL_STATUS_COLORS, NCBA_REPORT_THEME, REPORT_COLOR_PALETTES } from "./reportTheme";

const { Text } = Typography;

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  border: `1px solid ${NCBA_REPORT_THEME.line}`,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(36, 26, 23, 0.08)",
  padding: "10px 12px",
};

// Create your own formatNumber function
const formatNumber = (value) => {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat().format(value);
};

const getShareLabel = (value, total) => {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

// Or create a more comprehensive formatter with options
const formatNumberWithOptions = (value, options = {}) => {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat(options.locale || "en-US", {
    minimumFractionDigits: options.minimumFractionDigits || 0,
    maximumFractionDigits: options.maximumFractionDigits || 0,
    ...options,
  }).format(value);
};

export default function DclAnalyticsDashboard({ rows }) {
  const computed = useMemo(
    () => buildDclAnalytics(rows, DCL_STATUS_COLORS),
    [rows],
  );

  if (!rows.length) {
    return (
      <Empty
        description="No DCL analytics available for the selected filters"
        style={{ margin: "8px 0 0" }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total DCLs
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                {formatNumber(computed.total)}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Status Types
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                {formatNumber(computed.statusRows.length)}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Active Loan Types
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: NCBA_REPORT_THEME.brandDeep }}>
                {formatNumber(computed.loanTypeRows.length)}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title="Status Distribution" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={computed.statusRows}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={48}
                    paddingAngle={2}
                    label={({ value, percent }) => (percent >= 0.08 ? `${value} (${(percent * 100).toFixed(0)}%)` : "")}
                  >
                    {computed.statusRows.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.color} />
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
                      `${formatNumber(value)} DCLs (${getShareLabel(Number(value), computed.total)})`,
                      item?.payload?.name || "Status",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title="Top Loan Types" size="small" style={{ borderRadius: 14 }}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={computed.loanTypeRows} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={NCBA_REPORT_THEME.line} />
                  <XAxis
                    dataKey="name"
                    angle={-18}
                    textAnchor="end"
                    interval={0}
                    height={68}
                    tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
                  <RechartsTooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, _name, item) => [
                      `${formatNumber(value)} DCLs (${getShareLabel(Number(value), computed.total)})`,
                      item?.payload?.name || "Loan Type",
                    ]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={34}>
                    {computed.loanTypeRows.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={DCL_BAR_COLORS[index % DCL_BAR_COLORS.length]}
                      />
                    ))}
                    <LabelList dataKey="value" position="top" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Top Relationship Managers" size="small" style={{ borderRadius: 14 }}>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={computed.rmRows} layout="vertical" margin={{ top: 8, right: 16, left: 20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={NCBA_REPORT_THEME.line} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: NCBA_REPORT_THEME.inkSoft }} />
              <RechartsTooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, _name, item) => [
                  `${formatNumber(value)} DCLs (${getShareLabel(Number(value), computed.total)})`,
                  item?.payload?.name || "Relationship Manager",
                ]}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 8]} barSize={22}>
                {computed.rmRows.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={[
                      REPORT_COLOR_PALETTES.ocean[0],
                      REPORT_COLOR_PALETTES.citrus[0],
                      REPORT_COLOR_PALETTES.amber[0],
                      REPORT_COLOR_PALETTES.plum[0],
                    ][index % 4]}
                  />
                ))}
                <LabelList dataKey="value" position="right" fill={NCBA_REPORT_THEME.inkSoft} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}