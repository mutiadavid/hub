import React from 'react';
import { Dropdown, Button } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined, FileTextOutlined, GlobalOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const runExportCSV = (data, columns, filename) => {
  if (!data || !data.length) return;
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      let value = typeof col.accessor === "function" ? col.accessor(row) : row[col.key] ?? "-";
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}-${dayjs().format("YYYY-MM-DD")}.csv`);
};

export const runExportExcel = (data, columns, filename) => {
  if (!data || !data.length) return;
  const rows = data.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.header] = typeof col.accessor === "function" ? col.accessor(row) : row[col.key] ?? "-";
      return acc;
    }, {})
  );
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), `${filename}-${dayjs().format("YYYY-MM-DD")}.xlsx`);
};

export const runExportPDF = (data, columns, filename, title = "Exported Data") => {
  if (!data || !data.length) return;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.setTextColor(21, 49, 58);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(98, 113, 127);
  doc.text(`Exported on ${dayjs().format("DD MMM YYYY, HH:mm:ss")}  •  ${data.length} record(s)`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((col) => typeof col.accessor === "function" ? col.accessor(row) : row[col.key] ?? "-")),
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [255, 255, 255], textColor: [21, 49, 58], fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { top: 28, left: 14, right: 14 },
  });
  doc.save(`${filename}-${dayjs().format("YYYY-MM-DD")}.pdf`);
};

export const runExportWebView = (data, columns, title = "Data Export") => {
  if (!data || !data.length) return;
  const headers = columns.map((c) => `<th>${c.header}</th>`).join("");
  const bodyRows = data.map((row) => {
    const cells = columns.map((col) => `<td>${typeof col.accessor === "function" ? col.accessor(row) : row[col.key] ?? "-"}</td>`).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>${title} — ${dayjs().format("DD MMM YYYY")}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#ffffff;color:#15313a;margin:0;padding:24px}
  h1{font-size:22px;margin-bottom:4px} p{color:#62717f;font-size:13px;margin:0 0 20px}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06)}
  th{background:#ffffff;color:#15313a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:10px 12px;text-align:left;border-bottom:1px solid rgba(21,49,58,.08)}
  td{padding:9px 12px;font-size:13px;border-bottom:1px solid rgba(21,49,58,.06);vertical-align:top}
  @media print{body{padding:0}}
</style></head><body>
<h1>${title}</h1>
<p>Exported ${dayjs().format("DD MMM YYYY, HH:mm:ss")} &nbsp;•&nbsp; ${data.length} record(s)</p>
<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>
</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.addEventListener("load", () => URL.revokeObjectURL(url));
};

export const ExportMenu = ({ data, columns, filename, title, loading, buttonText = "Export" }) => {
  const handleExport = (type) => {
    if (type === "pdf") runExportPDF(data, columns, filename, title);
    if (type === "excel") runExportExcel(data, columns, filename);
    if (type === "csv") runExportCSV(data, columns, filename);
    if (type === "web") runExportWebView(data, columns, title);
  };

  const menuItems = [
    { key: "pdf", label: "Export as PDF", icon: <FilePdfOutlined style={{ color: "#dc2626" }} />, onClick: () => handleExport("pdf") },
    { key: "excel", label: "Export as Excel", icon: <FileExcelOutlined style={{ color: "#16a34a" }} />, onClick: () => handleExport("excel") },
    { key: "csv", label: "Export as CSV", icon: <FileTextOutlined style={{ color: "#0284c7" }} />, onClick: () => handleExport("csv") },
    { type: "divider" },
    { key: "web", label: "Open Web View", icon: <GlobalOutlined style={{ color: "#7c3aed" }} />, onClick: () => handleExport("web") },
  ];
  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]} disabled={loading || !data || data.length === 0}>
      <Button icon={<DownloadOutlined />} loading={loading}>{buttonText}</Button>
    </Dropdown>
  );
};
