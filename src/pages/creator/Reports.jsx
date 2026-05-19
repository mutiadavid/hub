import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import "../../styles/creatorTableOverrides.css";
import {
  Tabs,
  Tooltip,
  Button,
  Typography,
  Spin,
  Modal,
  message,
} from "antd";
import {
  DownloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import ncbaLogoPNG from "../../assets/ncbabanklogo.png";

import deferralApi from "../../service/deferralApi";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";
import { formatDate } from "../../utils/checklistUtils";
import { hasClosedCloseRequestDocuments } from "../../utils/deferralDocuments";
import AllDCLsTable from "./AllDCLsTable";
import ReportsFilters from "./ReportsFilters";
import useReportsFilters from "../../hooks/useReportsFilters";
import DclAnalyticsDashboard from "./reports/DclAnalyticsDashboard";
import DeferralsDashboard from "./reports/DeferralsDashboard";
import DeferralsReportTable from "./reports/DeferralsReportTable";
import DeferralTATTable from "./reports/DeferralTATTable";
import TATConsumedDashboard from "./reports/TATConsumedDashboard";
import TATConsumedTablesView from "./reports/TATConsumedTablesView";
import {
  DCL_DISPLAY_NAME,
  DCL_PLURAL_DISPLAY_NAME,
  DCL_TABS,
  DEFERRAL_TABS,
  TAT_TABS,
} from "./reports/reportTheme";
import {
  buildTATTableRows,
  getDocumentEntries,
  getDueDate,
  getOverdueDays,
  safeLower,
} from "./reports/reportUtils";

const { Text } = Typography;
const LIVE_REPORT_TICK_MS = 1000;
const pageRootClassName =
  "min-h-full w-full bg-white [font-family:'Century_Gothic','CenturyGothic','AppleGothic',sans-serif]";
const shellClassName = "flex w-full flex-col gap-4";
const cardClassName =
  "overflow-hidden rounded-lg border border-[#d6bd9833] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName =
  "flex flex-col gap-3 border-b border-[#d6bd9833] bg-white p-4 md:flex-row md:flex-wrap md:items-center md:justify-between";
const titleBlockClassName = "flex min-w-[260px] flex-col gap-1";
const titleClassName = "m-0 text-[15px] font-bold leading-tight tracking-[-0.02em] text-[#1f2933]";
const actionsClassName = "flex items-center justify-end gap-5 md:flex-nowrap";
const tabsClassName =
  "min-w-0 flex-initial [&_.ant-tabs-ink-bar]:h-0.5 [&_.ant-tabs-ink-bar]:rounded-none [&_.ant-tabs-ink-bar]:bg-[#164679] [&_.ant-tabs-nav]:m-0 [&_.ant-tabs-nav]:border-b-0 [&_.ant-tabs-nav-wrap]:overflow-auto [&_.ant-tabs-nav:before]:hidden [&_.ant-tabs-tab]:mr-8 [&_.ant-tabs-tab]:ml-2 [&_.ant-tabs-tab]:rounded-none [&_.ant-tabs-tab]:border-0 [&_.ant-tabs-tab]:bg-transparent [&_.ant-tabs-tab]:px-3 [&_.ant-tabs-tab]:pb-3 [&_.ant-tabs-tab]:pt-3.5 [&_.ant-tabs-tab]:text-xs [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-[#6b7280] [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-[#164679] [&_.ant-tabs-tab-btn]:text-[13px] [&_.ant-tabs-tab-btn]:font-semibold [&_.ant-tabs-tab-btn]:leading-tight [&_.ant-tabs-tab-btn]:text-[#4b5563] max-md:[&_.ant-tabs-tab]:mr-[24px] max-md:[&_.ant-tabs-tab]:pb-2.5 max-md:[&_.ant-tabs-tab]:pt-3";
const exportButtonClassName =
  "h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-md border border-[#d6bd9833] bg-white text-[#4b5563] shadow-none hover:border-[#164679] hover:bg-white hover:text-[#164679] focus:border-[#164679] focus:bg-white focus:text-[#164679]";
const contentClassName =
  "overflow-hidden rounded-lg border border-[#d6bd9833] bg-white p-4 shadow-[0_1px_2px_rgba(26,54,54,0.06)] max-md:p-3 [&_.ant-card]:border-0 [&_.ant-card]:shadow-none [&_.ant-card-body]:bg-transparent [&_.ant-card-body]:shadow-none";
const generatedClassName = "mt-[-2px] text-xs text-[#6b7280]";
const modalRootClassName =
  "[&_.ant-modal-body]:bg-white [&_.ant-modal-body]:p-5 [&_.ant-modal-close]:top-2 [&_.ant-modal-close]:end-2 [&_.ant-modal-close]:text-[#4b5563] hover:[&_.ant-modal-close]:bg-[#f3f4f6] hover:[&_.ant-modal-close]:text-[#1f2933] [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-xl [&_.ant-modal-content]:border [&_.ant-modal-content]:border-[#e5e7eb] [&_.ant-modal-content]:bg-white [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:shadow-[0_20px_45px_rgba(17,24,39,0.16)] [&_.ant-modal-header]:m-0 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-[#e5e7eb] [&_.ant-modal-header]:bg-white [&_.ant-modal-header]:px-5 [&_.ant-modal-header]:pb-3 [&_.ant-modal-header]:pt-[18px] [&_.ant-modal-title]:text-[15px] [&_.ant-modal-title]:font-bold [&_.ant-modal-title]:leading-tight [&_.ant-modal-title]:text-[#1f2933]";
const modalOptionsClassName = "flex flex-col gap-2.5";
const modalOptionButtonClassName =
  "flex h-11 min-h-11 items-center justify-start gap-2.5 rounded-lg border border-[#d6bd9838] bg-white px-3.5 text-left font-semibold text-[#1f2933] shadow-none hover:border-[#1a363638] hover:bg-[#faf7f3] hover:text-[#1f2933] focus:border-[#1a363638] focus:bg-[#faf7f3] focus:text-[#1f2933] [&_.anticon]:text-[15px] [&_.anticon]:text-[#164679]";
const modalNoteClassName = "mt-1 pl-0.5 text-xs text-[#6b7280]";
const TABLE_EXPORT_TABS = new Set(["deferrals", "allDCLs", "tatConsumed"]);
const EXPORT_THEME = {
  brand: "#164679",
  brandSoft: "#eef4fb",
  accent: "#d6bd98",
  border: "#e5e7eb",
  text: "#1f2933",
  muted: "#6b7280",
  background: "#faf7f3",
};
const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 17;

const parseReportDate = (value) => {
  if (!value) return dayjs.invalid();

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmedValue);
    return dayjs(hasExplicitTimezone ? trimmedValue : `${trimmedValue}Z`);
  }

  return dayjs(value);
};

const formatReportDate = (value, pattern = "DD MMM YYYY") => {
  const parsed = parseReportDate(value);
  return parsed.isValid() ? parsed.format(pattern) : "-";
};

const safeCellValue = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return "-";
  }

  return String(value);
};

const isWeekend = (moment) => {
  const day = moment.day();
  return day === 0 || day === 6;
};

const calculateBusinessMilliseconds = (started, ended) => {
  if (!started?.isValid?.() || !ended?.isValid?.() || !ended.isAfter(started)) {
    return 0;
  }

  let cursor = started.clone();
  let totalMs = 0;

  while (cursor.isBefore(ended)) {
    if (isWeekend(cursor)) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_START_HOUR);
      continue;
    }

    if (cursor.hour() < BUSINESS_START_HOUR) {
      cursor = cursor.hour(BUSINESS_START_HOUR).minute(0).second(0).millisecond(0);
    } else if (cursor.hour() >= BUSINESS_END_HOUR) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_START_HOUR);
      continue;
    }

    const endOfBusinessDay = cursor
      .clone()
      .hour(BUSINESS_END_HOUR)
      .minute(0)
      .second(0)
      .millisecond(0);
    const intervalEnd = ended.isBefore(endOfBusinessDay) ? ended : endOfBusinessDay;

    if (intervalEnd.isAfter(cursor)) {
      totalMs += intervalEnd.diff(cursor);
      cursor = intervalEnd;
    }

    if (cursor.isBefore(ended)) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_START_HOUR);
    }
  }

  return totalMs;
};

const formatBusinessDuration = (diffMs) => {
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const businessDayMinutes = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60;
  const businessDays = Math.floor(totalMinutes / businessDayMinutes);
  const remainingMinutes = totalMinutes % businessDayMinutes;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (businessDays > 0) {
    return hours > 0 ? `${businessDays}d ${hours}h` : `${businessDays}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return "0m";
};

const getDclTatDisplayValue = (row, nowAt) => {
  const started = parseReportDate(row?.createdAt);
  if (!started.isValid()) {
    return "N/A";
  }

  return formatBusinessDuration(calculateBusinessMilliseconds(started, nowAt));
};

const getChecklistStatusMeta = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "approved" || normalizedStatus === "completed") {
    return { label: normalizedStatus === "completed" ? "Completed" : "Approved" };
  }

  if (normalizedStatus === "rejected") {
    return { label: "Rejected" };
  }

  if (["pending", "active"].includes(normalizedStatus)) {
    return { label: normalizedStatus === "active" ? "Active" : "Pending" };
  }

  if (["rm_review", "rmreview"].includes(normalizedStatus)) {
    return { label: "RM Review" };
  }

  if (["co_checker_review", "cocheckerreview"].includes(normalizedStatus)) {
    return { label: "Checker Review" };
  }

  if (["co_creator_review", "cocreatorreview"].includes(normalizedStatus)) {
    return { label: "Co-Creator Review" };
  }

  if (["revived", "closed"].includes(normalizedStatus)) {
    return { label: normalizedStatus === "closed" ? "Closed" : "Revived" };
  }

  return {
    label: safeCellValue(status).replace(/_/g, " "),
  };
};

const getReportStatusMeta = (deferral) => {
  if (hasClosedCloseRequestDocuments(deferral)) {
    return { label: "Closed", variant: "approved" };
  }

  const normalizedStatus = safeLower(deferral?.status);

  if (normalizedStatus === "approved" || normalizedStatus === "deferral_approved") {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus === "partially_approved" || normalizedStatus === "in_review") {
    return { label: "In Review", variant: "qs-review" };
  }

  if (normalizedStatus.includes("rejected") || normalizedStatus.includes("returned")) {
    return {
      label: normalizedStatus.includes("returned") ? "Returned" : "Rejected",
      variant: "rework",
    };
  }

  if (normalizedStatus.includes("pending") || normalizedStatus.includes("open")) {
    return { label: "Pending", variant: "pending" };
  }

  if (normalizedStatus === "withdrawn") {
    return { label: "Withdrawn", variant: "rework" };
  }

  return {
    label: String(deferral?.status || "In Progress")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    variant: "qs-review",
  };
};

const getCheckerApproverName = (row) => {
  const approver =
    row?.assignedToCoChecker ||
    row?.assignedChecker ||
    row?.checkerAssigned ||
    row?.coChecker ||
    null;

  return (
    approver?.name ||
    approver?.checkerName ||
    approver?.fullName ||
    approver?.userName ||
    "Not Assigned"
  );
};

const getChecklistDocumentCount = (row) =>
  row?.documents?.reduce((total, category) => total + (category?.docList?.length || 0), 0) || 0;

const getFilterSummary = (filters) => {
  const parts = [];

  if (filters?.dateRange?.[0] && filters?.dateRange?.[1]) {
    parts.push(
      `${filters.dateRange[0].format("DD MMM YYYY")} - ${filters.dateRange[1].format("DD MMM YYYY")}`,
    );
  }

  if (filters?.status) {
    parts.push(`Status: ${filters.status}`);
  }

  if (filters?.searchText) {
    parts.push(`Search: ${filters.searchText}`);
  }

  if (filters?.itemType) {
    parts.push(`Type: ${filters.itemType}`);
  }

  return parts.length ? parts.join("  •  ") : "All records";
};

const getTabularExportDefinition = ({
  activeTab,
  tatView,
  filteredDeferrals,
  filteredAllDcls,
  deferralTatRows,
  dclTatRows,
  filters,
  nowAt,
}) => {
  if (activeTab === "deferrals" || activeTab === "deferralCharts") {
    return {
      filenameKey: "deferrals",
      title: "Deferrals Report",
      filterSummary: getFilterSummary(filters),
      columns: [
        { title: "Deferral No", value: (row) => safeCellValue(row?.deferralNumber) },
        { title: "DCL No", value: (row) => safeCellValue(row?.dclNo || row?.dclNumber) },
        { title: "Customer", value: (row) => safeCellValue(row?.customerName || row?.customerNumber) },
        { title: "RM", value: (row) => safeCellValue(row?.createdBy?.name || row?.requestor?.name) },
        { title: "Status", value: (row) => safeCellValue(getReportStatusMeta(row).label) },
        { title: "Created", value: (row) => formatReportDate(row?.createdAt) },
        { title: "Due Date", value: (row) => formatReportDate(getDueDate(row)) },
        { title: "Overdue Days", value: (row) => String(Math.max(0, getOverdueDays(row))) },
      ],
      rows: filteredDeferrals,
    };
  }

  if (activeTab === "allDCLs" || activeTab === "dclCharts") {
    return {
      filenameKey: "all_dcls",
      title: `${DCL_DISPLAY_NAME} Report`,
      filterSummary: getFilterSummary(filters),
      columns: [
        { title: "DCL No", value: (row) => safeCellValue(row?.dclNo) },
        { title: "Customer No", value: (row) => safeCellValue(row?.customerNumber) },
        { title: "Customer Name", value: (row) => safeCellValue(row?.customerName) },
        { title: "IBPS No", value: (row) => safeCellValue(row?.ibpsNo || "Not set") },
        { title: "Loan Type", value: (row) => safeCellValue(row?.loanType) },
        { title: "Checker - Approver", value: (row) => safeCellValue(getCheckerApproverName(row)) },
        { title: "Docs", value: (row) => String(getChecklistDocumentCount(row)) },
        { title: "Completed Date", value: (row) => safeCellValue(row?.updatedAt ? formatDate(row.updatedAt) : "—") },
        { title: "TAT Consumed", value: (row) => getDclTatDisplayValue(row, nowAt) },
        { title: "Status", value: (row) => safeCellValue(getChecklistStatusMeta(row?.status).label) },
      ],
      rows: filteredAllDcls,
    };
  }

  const effectiveTatView =
    tatView || (filters?.itemType === "DCL" ? "dcl" : filters?.itemType === "Deferral" ? "deferral" : "deferral");

  if (activeTab === "tatConsumed" || activeTab === "tatConsumedCharts") {
    if (effectiveTatView === "dcl") {
      return {
        filenameKey: "tat_consumed_dcl",
        title: `${DCL_DISPLAY_NAME} TAT Report`,
        filterSummary: getFilterSummary(filters),
        columns: [
          { title: `${DCL_DISPLAY_NAME} Number`, value: (row) => safeCellValue(row?.itemId) },
          { title: "Customer", value: (row) => safeCellValue(row?.customerName) },
          { title: "Created", value: (row) => formatReportDate(row?.createdAt, "DD MMM YYYY HH:mm") },
          { title: "CO Creator TAT", value: (row) => safeCellValue(row?.coCreatorTat?.label) },
          { title: "RM TAT", value: (row) => safeCellValue(row?.rmReviewTat?.label || row?.rmTat?.label) },
          { title: "Checker TAT", value: (row) => safeCellValue(row?.coCheckerTat?.label) },
          { title: "Total TAT", value: (row) => safeCellValue(row?.totalTatLabel) },
          { title: "Status", value: (row) => safeCellValue(row?.status) },
        ],
        rows: dclTatRows,
      };
    }

    return {
      filenameKey: "tat_consumed_deferrals",
      title: "Deferral TAT Report",
      filterSummary: getFilterSummary(filters),
      columns: [
        { title: "Deferral ID", value: (row) => safeCellValue(row?.itemId) },
        { title: "Customer", value: (row) => safeCellValue(row?.customerName) },
        { title: "Created", value: (row) => formatReportDate(row?.createdAt, "DD MMM YYYY HH:mm") },
        { title: "RM TAT", value: (row) => safeCellValue(row?.rmTat?.label) },
        { title: "Approvers TAT", value: (row) => safeCellValue(row?.approversTat?.label) },
        { title: "CO Creator TAT", value: (row) => safeCellValue(row?.coCreatorTat?.label) },
        { title: "CO Checker TAT", value: (row) => safeCellValue(row?.coCheckerTat?.label) },
        { title: "Total TAT", value: (row) => safeCellValue(row?.totalTatLabel) },
      ],
      rows: deferralTatRows,
    };
  }

  return null;
};

const downloadCsvFromDefinition = (definition, filename) => {
  const lines = [
    definition.columns.map((column) => `"${column.title.replace(/"/g, '""')}"`).join(","),
    ...definition.rows.map((row) =>
      definition.columns
        .map((column) => `"${safeCellValue(column.value(row)).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const downloadExcelFromDefinition = (definition, filename) => {
  const workbook = XLSX.utils.book_new();
  const generatedOn = dayjs().format("DD MMM YYYY HH:mm:ss");
  const rowData = definition.rows.map((row) =>
    Object.fromEntries(
      definition.columns.map((column) => [column.title, safeCellValue(column.value(row))]),
    ),
  );
  const worksheet = XLSX.utils.json_to_sheet(rowData);
  worksheet["!cols"] = definition.columns.map((column) => ({
    wch: Math.max(
      column.title.length + 4,
      ...rowData.map((row) => String(row[column.title] || "").length + 2),
    ),
  }));

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Report", definition.title],
    ["Generated On", generatedOn],
    ["Filters", definition.filterSummary || "All records"],
    ["Records", definition.rows.length],
  ]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  XLSX.writeFile(workbook, filename);
};

const exportStructuredPdf = async (definition, filename) => {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableModule.default;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const generatedOn = dayjs().format("DD MMM YYYY HH:mm:ss");
  const filterSummary = definition.filterSummary || "All records";
  const logoWidth = 24;
  const logoHeight = 7;

  const drawHeader = () => {
    pdf.setFillColor("#FFFFFF");
    pdf.rect(0, 0, pageWidth, 42, "F");

    try {
      pdf.addImage(ncbaLogoPNG, "PNG", pageWidth - margin - logoWidth, 10, logoWidth, logoHeight);
    } catch (error) {
      console.warn("Could not add NCBA logo to report PDF:", error);
    }

    pdf.setTextColor(EXPORT_THEME.text);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(definition.title, margin, 17);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Generated on ${generatedOn}`, margin, 23);

    pdf.setFontSize(8.5);
    pdf.setTextColor(EXPORT_THEME.muted);
    pdf.text(`Filters: ${filterSummary}`, margin, 31, {
      maxWidth: pageWidth - margin * 2 - logoWidth - 8,
    });

    pdf.text(`Records: ${definition.rows.length}`, margin, 36);
    pdf.setDrawColor(EXPORT_THEME.border);
    pdf.line(margin, 40, pageWidth - margin, 40);
  };

  const drawFooter = () => {
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(EXPORT_THEME.border);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(EXPORT_THEME.muted);
      pdf.text("NCBA DCL & Deferral Reporting", margin, pageHeight - 7);
      pdf.text(`Page ${page} of ${pages}`, pageWidth - margin - 18, pageHeight - 7);
    }
  };

  drawHeader();

  autoTable(pdf, {
    startY: 46,
    margin: { left: margin, right: margin, top: 46, bottom: 18 },
    head: [definition.columns.map((column) => column.title)],
    body: definition.rows.map((row) => definition.columns.map((column) => safeCellValue(column.value(row)))),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: EXPORT_THEME.text,
      lineColor: EXPORT_THEME.border,
      lineWidth: 0.15,
      cellPadding: { top: 3.2, right: 2.6, bottom: 3.2, left: 2.6 },
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: "#FFFFFF",
      textColor: EXPORT_THEME.text,
      fontStyle: "bold",
      lineColor: EXPORT_THEME.border,
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: "#FFFFFF",
    },
    didDrawPage: () => {
      drawHeader();
    },
  });

  drawFooter();
  pdf.save(filename);
};

const openReportWebView = ({ title, filterSummary, generatedOn, contentMarkup, stylesheetMarkup }) => {
  const popup = window.open("", "_blank");

  if (!popup) {
    throw new Error("Unable to open report preview window.");
  }

  popup.document.open();
  popup.document.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${stylesheetMarkup}
    <style>
      body {
        margin: 0;
        background: #f5f7fa;
        color: #1f2933;
        font-family: 'Century Gothic', CenturyGothic, AppleGothic, sans-serif;
      }

      .report-webview-shell {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 24px 40px;
      }

      .report-webview-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 20px;
      }

      .report-webview-title {
        margin: 0;
        font-size: 24px;
        line-height: 1.2;
      }

      .report-webview-meta {
        margin-top: 8px;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.5;
      }

      .report-webview-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .report-webview-button {
        border: 1px solid #d6bd98;
        background: #ffffff;
        color: #164679;
        border-radius: 8px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .report-webview-surface {
        background: #ffffff;
        border: 1px solid rgba(214, 189, 152, 0.2);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(17, 24, 39, 0.08);
      }

      @media print {
        body {
          background: #ffffff;
        }

        .report-webview-toolbar {
          display: none;
        }

        .report-webview-shell {
          max-width: none;
          margin: 0;
          padding: 0;
        }

        .report-webview-surface {
          border: 0;
          box-shadow: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="report-webview-shell">
      <div class="report-webview-toolbar">
        <div>
          <h1 class="report-webview-title">${title}</h1>
          <div class="report-webview-meta">Generated on ${generatedOn}</div>
          <div class="report-webview-meta">Filters: ${filterSummary || "All records"}</div>
        </div>
        <div class="report-webview-actions">
          <button class="report-webview-button" onclick="window.print()">Print</button>
          <button class="report-webview-button" onclick="window.close()">Close</button>
        </div>
      </div>
      <div class="report-webview-surface">${contentMarkup}</div>
    </div>
  </body>
</html>`);
  popup.document.close();
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("deferrals");
  const [loading, setLoading] = useState(false);
  const [allDeferrals, setAllDeferrals] = useState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState("");
  const [activeTatView, setActiveTatView] = useState("deferral");
  const [reportNow, setReportNow] = useState(() => dayjs());
  const token = useSelector((state) => state?.auth?.token);
  const reportContentRef = React.useRef(null);

  const { filters, setFilters, clearFilters } = useReportsFilters();
  const isTatTab = TAT_TABS.includes(activeTab);

  useEffect(() => {
    setReportNow(dayjs());

    if (!isTatTab) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setReportNow(dayjs());
    }, LIVE_REPORT_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isTatTab]);

  const { data: allDcls = [] } = useGetAllCoCreatorChecklistsQuery(undefined, {
    skip: !DCL_TABS.includes(activeTab) && !TAT_TABS.includes(activeTab),
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!DEFERRAL_TABS.includes(activeTab) && !TAT_TABS.includes(activeTab)) {
      return;
    }

    const fetchLiveDeferrals = async () => {
      setLoading(true);
      try {
        const allRows = await deferralApi.getAllDeferrals(token).catch(async () => {
          const [pending, approved, returned, mine, closeWorkflow] = await Promise.all([
            deferralApi.getPendingDeferrals(token).catch(() => []),
            deferralApi.getApprovedDeferrals(token).catch(() => []),
            deferralApi.getReturnedDeferrals(token).catch(() => []),
            deferralApi.getMyDeferrals(token).catch(() => []),
            deferralApi.getCloseWorkflowDeferrals(token).catch(() => []),
          ]);

          const combined = [
            ...(Array.isArray(pending) ? pending : []),
            ...(Array.isArray(approved) ? approved : []),
            ...(Array.isArray(returned) ? returned : []),
            ...(Array.isArray(mine) ? mine : []),
            ...(Array.isArray(closeWorkflow) ? closeWorkflow : []),
          ];

          return Array.from(
            new Map(combined.map((d) => [String(d?._id || d?.id || ""), d])).values(),
          ).filter((d) => !!(d?._id || d?.id));
        });

        setAllDeferrals(Array.isArray(allRows) ? allRows : []);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveDeferrals();
  }, [activeTab, token]);

  const filteredDeferrals = useMemo(() => {
    if (isTatTab && filters.itemType === "DCL") {
      return [];
    }

    let rows = [...allDeferrals];

    if (filters.searchText) {
      const query = safeLower(filters.searchText);
      rows = rows.filter((deferral) => {
        const docNames = getDocumentEntries(deferral)
          .map((doc) => safeLower(doc.name))
          .join(" ");

        return (
          safeLower(deferral.deferralNumber).includes(query) ||
          safeLower(deferral.customerName).includes(query) ||
          safeLower(deferral.customerNumber).includes(query) ||
          safeLower(deferral.dclNo || deferral.dclNumber).includes(query) ||
          safeLower(deferral.createdBy?.name).includes(query) ||
          docNames.includes(query)
        );
      });
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const [start, end] = filters.dateRange;
      const startTime = start.startOf("day").valueOf();
      const endTime = end.endOf("day").valueOf();
      rows = rows.filter((deferral) => {
        const createdAt = deferral.createdAt ? dayjs(deferral.createdAt) : null;
        return (
          createdAt &&
          createdAt.isValid() &&
          createdAt.valueOf() >= startTime &&
          createdAt.valueOf() <= endTime
        );
      });
    }

    if (isTatTab && filters.status) {
      rows = rows.filter(
        (deferral) => String(deferral?.status || "").toLowerCase() === String(filters.status).toLowerCase(),
      );
    }

    return rows;
  }, [allDeferrals, filters, isTatTab]);

  const filteredAllDcls = useMemo(() => {
    if (isTatTab && filters.itemType === "Deferral") {
      return [];
    }

    return (allDcls || []).filter((row) => {
      const searchMatch = !filters.searchText
        ? true
        : row.dclNo?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          row.customerName?.toLowerCase().includes(filters.searchText.toLowerCase());

      const dateMatch = !isTatTab || !filters.dateRange || !filters.dateRange[0] || !filters.dateRange[1]
        ? true
        : (() => {
            const startTime = filters.dateRange[0].startOf("day").valueOf();
            const endTime = filters.dateRange[1].endOf("day").valueOf();
            const createdAt = row.createdAt ? dayjs(row.createdAt) : null;
            return (
              createdAt &&
              createdAt.isValid() &&
              createdAt.valueOf() >= startTime &&
              createdAt.valueOf() <= endTime
            );
          })();

      const statusMatch = !filters.status
        ? true
        : String(row.status).toLowerCase() === String(filters.status).toLowerCase();

      return searchMatch && statusMatch && dateMatch;
    });
  }, [allDcls, filters, isTatTab]);

  const deferralTatExportRows = useMemo(
    () => DeferralTATTable.buildRows(filteredDeferrals, reportNow),
    [filteredDeferrals, reportNow],
  );

  const dclTatExportRows = useMemo(
    () => buildTATTableRows([], filteredAllDcls, reportNow).filter((row) => row.workflowType === "DCL"),
    [filteredAllDcls, reportNow],
  );

  const currentExportLabel = useMemo(() => {
    if (activeTab === "allDCLs") return "all_dcls";
    if (activeTab === "dclCharts") return "dcl_charts";
    if (activeTab === "deferralCharts") return "deferral_charts";
    if (activeTab === "tatConsumed") return "tat_consumed";
    if (activeTab === "tatConsumedCharts") return "tat_consumed_charts";
    return "deferrals";
  }, [activeTab]);

  const getExportFileBase = () =>
    `${currentExportLabel}_${dayjs().format("YYYYMMDD_HHmmss")}`;

  const currentTabularExport = useMemo(
    () =>
      getTabularExportDefinition({
        activeTab,
        tatView: activeTatView,
        filteredDeferrals,
        filteredAllDcls,
        deferralTatRows: deferralTatExportRows,
        dclTatRows: dclTatExportRows,
        filters,
        nowAt: reportNow,
      }),
    [activeTab, activeTatView, dclTatExportRows, deferralTatExportRows, filteredAllDcls, filteredDeferrals, filters, reportNow],
  );

  const exportCsvReport = (definition) => {
    if (!definition?.rows?.length) {
      message.warning("No report data available to export.");
      return;
    }

    downloadCsvFromDefinition(definition, `${definition.filenameKey}_${dayjs().format("YYYYMMDD_HHmmss")}.csv`);
    message.success("CSV downloaded successfully.");
  };

  const exportExcelReport = (definition) => {
    if (!definition?.rows?.length) {
      message.warning("No report data available to export.");
      return;
    }

    downloadExcelFromDefinition(
      definition,
      `${definition.filenameKey}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
    );
    message.success("Excel downloaded successfully.");
  };

  const openCurrentReportWebView = () => {
    const target = reportContentRef.current;
    if (!target) {
      message.error("Report surface not ready for web view.");
      return;
    }

    const stylesheetMarkup = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((node) => node.outerHTML)
      .join("\n");

    try {
      openReportWebView({
        title: currentTabularExport?.title || `${DCL_DISPLAY_NAME} Reports & Analytics`,
        filterSummary: currentTabularExport?.filterSummary || getFilterSummary(filters),
        generatedOn: reportNow.format("DD MMM YYYY HH:mm:ss"),
        contentMarkup: target.innerHTML,
        stylesheetMarkup,
      });
      message.success("Web view opened successfully.");
      setExportModalOpen(false);
    } catch (error) {
      console.error("Report web view failed:", error);
      message.error("Failed to open web view. Please allow pop-ups and try again.");
    }
  };

  const exportCurrentSurfacePdf = async () => {
    const target = reportContentRef.current;
    if (!target) {
      message.error("Report surface not ready for export.");
      return;
    }

    setExportingFormat("pdf");

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`${getExportFileBase()}.pdf`);
      message.success("PDF downloaded successfully.");
    } catch (error) {
      console.error("Report export failed:", error);
      message.error("Failed to export report. Please try again.");
    } finally {
      setExportingFormat("");
      setExportModalOpen(false);
    }
  };

  const handleSelectExportFormat = async (format) => {
    if (format === "csv") {
      exportCsvReport(currentTabularExport);
      setExportModalOpen(false);
      return;
    }

    if (format === "excel") {
      exportExcelReport(currentTabularExport);
      setExportModalOpen(false);
      return;
    }

    if (format === "web") {
      openCurrentReportWebView();
      return;
    }

    if (format === "pdf" && TABLE_EXPORT_TABS.has(activeTab) && currentTabularExport) {
      setExportingFormat(format);
      try {
        await exportStructuredPdf(
          currentTabularExport,
          `${currentTabularExport.filenameKey}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`,
        );
        message.success("PDF downloaded successfully.");
      } catch (error) {
        console.error("Report export failed:", error);
        message.error("Failed to export report. Please try again.");
      } finally {
        setExportingFormat("");
        setExportModalOpen(false);
      }
      return;
    }

    await exportCurrentSurfacePdf();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "deferrals":
        return (
          <Spin spinning={loading}>
            <DeferralsReportTable rows={filteredDeferrals} />
          </Spin>
        );
      case "deferralCharts":
        return (
          <Spin spinning={loading}>
            <DeferralsDashboard rows={filteredDeferrals} />
          </Spin>
        );
      case "allDCLs":
        return <AllDCLsTable filters={filters} />;
      case "dclCharts":
        return <DclAnalyticsDashboard rows={filteredAllDcls} />;
      case "tatConsumed":
        return (
          <Spin spinning={loading}>
            <TATConsumedTablesView
              deferralRows={filteredDeferrals}
              dclRows={filteredAllDcls}
              activeKey={activeTatView}
              onActiveKeyChange={setActiveTatView}
            />
          </Spin>
        );
      case "tatConsumedCharts":
        return (
          <Spin spinning={loading}>
            <TATConsumedDashboard deferralRows={filteredDeferrals} dclRows={filteredAllDcls} />
          </Spin>
        );
      default:
        return null;
    }
  };

  return (
    <div className={pageRootClassName}>
      <div className={shellClassName}>
        <div className={cardClassName}>
        <div className={toolbarClassName}>
          <div className={titleBlockClassName}>
            <div className={titleBlockClassName}>
              <h2 className={titleClassName}>
                {DCL_DISPLAY_NAME} Reports & Analytics
              </h2>
             
            </div>
          </div>

          <div className={actionsClassName}>
            <Tabs
              className={tabsClassName}
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                clearFilters();
              }}
              type="line"
              items={[
                {
                  key: "deferrals",
                  label: (
                    <span className="flex items-center gap-2">
                      <CheckCircleOutlined /> Deferrals
                    </span>
                  ),
                },
                {
                  key: "allDCLs",
                  label: (
                    <span className="flex items-center gap-2">
                      <FileTextOutlined /> All {DCL_PLURAL_DISPLAY_NAME}
                    </span>
                  ),
                },
                {
                  key: "deferralCharts",
                  label: (
                    <span className="flex items-center gap-2">
                      <BarChartOutlined /> Deferral Charts
                    </span>
                  ),
                },
                {
                  key: "dclCharts",
                  label: (
                    <span className="flex items-center gap-2">
                      <BarChartOutlined /> {DCL_DISPLAY_NAME} Charts
                    </span>
                  ),
                },
                {
                  key: "tatConsumed",
                  label: (
                    <span className="flex items-center gap-2">
                      <ClockCircleOutlined /> TAT Consumed
                    </span>
                  ),
                },
                {
                  key: "tatConsumedCharts",
                  label: (
                    <span className="flex items-center gap-2">
                      <BarChartOutlined /> TAT Charts
                    </span>
                  ),
                },
              ]}
            />

            <Tooltip title="Export Report" overlayClassName="reports-export-tooltip">
              <Button
                className={exportButtonClassName}
                icon={<DownloadOutlined />}
                onClick={() => setExportModalOpen(true)}
              />
            </Tooltip>
          </div>
        </div>
      </div>

      <ReportsFilters
        activeTab={activeTab}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
      />

      <div
        className={contentClassName}
        ref={reportContentRef}
      >
        {renderContent()}
      </div>

      <div className={generatedClassName}>
        Generated on {reportNow.format("DD/MM/YYYY HH:mm:ss")}
      </div>

      <Modal
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={null}
       
        width={420}
        centered
        className={modalRootClassName}
      >
        <div className={modalOptionsClassName}>
          <Button
            block
            icon={<FilePdfOutlined />}
            loading={exportingFormat === "pdf"}
            onClick={() => handleSelectExportFormat("pdf")}
            className={modalOptionButtonClassName}
          >
            Download as PDF
          </Button>
          <Button
            block
            icon={<FileTextOutlined />}
            loading={exportingFormat === "csv"}
            onClick={() => handleSelectExportFormat("csv")}
            className={modalOptionButtonClassName}
          >
            Download as CSV
          </Button>
          <Button
            block
            icon={<FileExcelOutlined />}
            loading={exportingFormat === "excel"}
            onClick={() => handleSelectExportFormat("excel")}
            className={modalOptionButtonClassName}
          >
            Download as Excel
          </Button>
          <Button
            block
            icon={<GlobalOutlined />}
            loading={exportingFormat === "web"}
            onClick={() => handleSelectExportFormat("web")}
            className={modalOptionButtonClassName}
          >
            Open in Web View
          </Button>
          <Text type="secondary" className={modalNoteClassName}>
            CSV and Excel use the visible report columns. Web View opens the current report in a printable browser page.
          </Text>
        </div>
      </Modal>
      </div>
    </div>
  );
}