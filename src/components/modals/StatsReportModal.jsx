// StatsReportModal.jsx
import React, { useMemo, useState } from "react";
import { Modal, Divider, Button, Select, Row, Col, Card } from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { generateStatsPDF } from "../../utils/reportGenerator";


import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#164679", "#b5d334", "#fcb116", "#7e6496", "#fcd716"];

const RMs = ["Alice", "Bob", "Charlie", "David", "Eva"];
const LoanTypes = ["Home Loan", "Car Loan", "Personal Loan", "Business Loan"];
const Statuses = ["approved", "rejected", "in progress"];

function randomDate(start, end) {
  return new Date(+start + Math.random() * (end - start));
}

function generateMockChecklists(count = 75) {
  return Array.from({ length: count }, (_, i) => {
    const createdAt = randomDate(new Date(2025, 0, 1), new Date(2025, 11, 30));
    const status = Statuses[Math.floor(Math.random() * Statuses.length)];
    const approvedAt =
      status === "approved"
        ? randomDate(createdAt, new Date(2025, 11, 31))
        : null;
    const docsCount = Math.floor(Math.random() * 5);
    const documents = Array.from(
      { length: docsCount },
      (_, j) => `doc${j + 1}.pdf`
    );
    return {
      dclNo: `DCL${String(i + 1).padStart(3, "0")}`,
      assignedToRM: { name: RMs[Math.floor(Math.random() * RMs.length)] },
      loanType: LoanTypes[Math.floor(Math.random() * LoanTypes.length)],
      status,
      createdAt: createdAt.toISOString().slice(0, 10),
      approvedAt: approvedAt ? approvedAt.toISOString().slice(0, 10) : null,
      documents,
    };
  });
}

export default function StatsReportModal({ open, onClose }) {
  const [checklists] = useState(generateMockChecklists(75));
  const [filterRM, setFilterRM] = useState(null);
  const [filterLoan, setFilterLoan] = useState(null);
  const [filterDCL, setFilterDCL] = useState(null);

  const resetFilters = () => {
    setFilterRM(null);
    setFilterLoan(null);
    setFilterDCL(null);
  };

  const filteredChecklists = useMemo(() => {
    return checklists
      .filter((c) => (filterRM ? c.assignedToRM?.name === filterRM : true))
      .filter((c) => (filterLoan ? c.loanType === filterLoan : true))
      .filter((c) => (filterDCL ? c.dclNo === filterDCL : true));
  }, [checklists, filterRM, filterLoan, filterDCL]);

  const rmOptions = [
    ...new Set(checklists.map((c) => c.assignedToRM?.name).filter(Boolean)),
  ];
  const loanTypeOptions = [...new Set(checklists.map((c) => c.loanType))];
  const dclOptions = [...new Set(checklists.map((c) => c.dclNo))];

  // ------------------- EXPORT -------------------
  const exportPDF = () => {
    const statsData = {
      "Total Checklists": safeChecklists.length,
      "Approved": safeChecklists.filter((c) => c.status === "approved").length,
      "Rejected": safeChecklists.filter((c) => c.status === "rejected").length,
      "In Progress": safeChecklists.filter(
        (c) => !["approved", "rejected"].includes(c.status)
      ).length,
      "Unique Loan Types": loanTypeData.length,
      "Average Docs per DCL": (
        safeChecklists.reduce((sum, c) => sum + (c.documents?.length || 0), 0) /
        Math.max(safeChecklists.length, 1)
      ).toFixed(2),
      "Filter - RM": filterRM || "All",
      "Filter - Loan Type": filterLoan || "All",
    };
    generateStatsPDF(statsData, "Checklist Statistics Report");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredChecklists);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Checklists");
    XLSX.writeFile(wb, "ChecklistReport.xlsx");
  };

  const printReport = () => {
    const content = document.getElementById("stats-report")?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(content);
    win.document.close();
    win.print();
  };

  // ------------------- ANALYTICS -------------------
  const safeChecklists = filteredChecklists.length
    ? filteredChecklists
    : [
        {
          status: "in progress",
          dclNo: "None",
          loanType: "None",
          documents: [],
        },
      ];

  const statusData = [
    {
      name: "Approved",
      value: safeChecklists.filter((c) => c.status === "approved").length,
    },
    {
      name: "Rejected",
      value: safeChecklists.filter((c) => c.status === "rejected").length,
    },
    {
      name: "In Progress",
      value: safeChecklists.filter(
        (c) => !["approved", "rejected"].includes(c.status)
      ).length,
    },
  ];

  const loanTypeData = Object.values(
    safeChecklists.reduce((acc, c) => {
      acc[c.loanType] = acc[c.loanType] || { name: c.loanType, count: 0 };
      acc[c.loanType].count++;
      return acc;
    }, {})
  );

  const documentsData = safeChecklists.map((c) => ({
    name: c.dclNo,
    docs: c.documents?.length || 0,
  }));

  const timeToApprove = safeChecklists
    .filter((c) => c.status === "approved" && c.approvedAt)
    .map((c) => ({
      dclNo: c.dclNo,
      days: Math.round(
        (new Date(c.approvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24)
      ),
    }));

  const monthlyTrend = Object.values(
    safeChecklists.reduce((acc, c) => {
      const month = c.createdAt?.slice(0, 7) || "2025-01";
      acc[month] = acc[month] || { month, count: 0 };
      acc[month].count++;
      return acc;
    }, {})
  );

  const movingAverage = monthlyTrend.map((point, idx, arr) => {
    const window =
      arr
        .slice(Math.max(0, idx - 2), idx + 1)
        .reduce((a, b) => a + b.count, 0) / Math.min(idx + 1, 3);
    return { month: point.month, avg: window };
  });

  const [aiInsights] = useState(
    "AI insights will appear here once we integrate OpenAI later."
  );

  // ------------------- RENDER -------------------
  return (
    <Modal
      title="📊 Checklist Analytics"
      width={1100}
      open={open}
      onCancel={onClose}
      footer={null}
      centered={false}
      wrapperClassName="modal-centered-in-content"
    >
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Select
            placeholder="Filter RM"
            allowClear
            style={{ width: "100%" }}
            onChange={setFilterRM}
            value={filterRM}
          >
            {rmOptions.map((rm) => (
              <Select.Option key={rm} value={rm}>
                {rm}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filter Loan Type"
            allowClear
            style={{ width: "100%" }}
            onChange={setFilterLoan}
            value={filterLoan}
          >
            {loanTypeOptions.map((lt) => (
              <Select.Option key={lt} value={lt}>
                {lt}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filter DCL"
            allowClear
            style={{ width: "100%" }}
            onChange={setFilterDCL}
            value={filterDCL}
          >
            {dclOptions.map((dcl) => (
              <Select.Option key={dcl} value={dcl}>
                {dcl}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Button onClick={resetFilters} style={{ width: "100%" }}>
            Reset Filters
          </Button>
        </Col>
      </Row>

      <div
        style={{ margin: "12px 0", display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <Button type="primary" onClick={exportPDF}>
          Export PDF
        </Button>
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button onClick={printReport}>Print</Button>
        <Button disabled>AI Insights (Coming Soon)</Button>
      </div>

      <div id="stats-report">
        <Divider>Status</Divider>
        <div id="chart-status">
          <PieChart width={350} height={250}>
            <Pie
              data={statusData}
              cx={170}
              cy={120}
              innerRadius={40}
              outerRadius={80}
              dataKey="value"
              label
            >
              {statusData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </div>

        <Divider>Loan Types</Divider>
        <BarChart width={650} height={300} data={loanTypeData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#164679" />
        </BarChart>

        <Divider>Documents per DCL</Divider>
        <LineChart width={650} height={300} data={documentsData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="docs" stroke="#b5d334" strokeWidth={3} />
        </LineChart>

        <Divider>Time To Approve (Days)</Divider>
        <BarChart
          width={650}
          height={300}
          data={
            timeToApprove.length ? timeToApprove : [{ dclNo: "None", days: 0 }]
          }
        >
          <XAxis dataKey="dclNo" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="days" fill="#fcb116" />
        </BarChart>

        <Divider>Monthly Trend</Divider>
        <AreaChart width={650} height={300} data={monthlyTrend}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area dataKey="count" fill="#7e6496" stroke="#7e6496" />
        </AreaChart>

        <Divider>Moving Average (3 months)</Divider>
        <LineChart width={650} height={300} data={movingAverage}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line dataKey="avg" stroke="#164679" strokeWidth={3} />
        </LineChart>

        <Divider>AI Insights Summary</Divider>
        <Card>{aiInsights}</Card>
      </div>
    </Modal>
  );
}
