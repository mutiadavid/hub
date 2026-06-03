import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { getStatusColor, hexToRGB } from "./statusColors";
import ncbaLogoPNG from '../assets/ncbabanklogo.png';

// ============================================
// PROFESSIONAL COLOR PALETTE
// ============================================
const COLORS = {
  primary: [15, 32, 66],      // Deep navy blue
  secondary: [0, 102, 153],    // Professional teal
  accent: [255, 107, 53],      // Vibrant orange
  light: [240, 244, 248],      // Light gray
  border: [200, 210, 220],     // Subtle border
  text: [30, 40, 50],          // Dark text
  textLight: [100, 110, 120],  // Light text
  white: [255, 255, 255],      // White
};

// ============================================
// HELPER: Add Professional Header
// ============================================
const addProfessionalHeader = (doc, title, subtitle = "") => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Gradient-like header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Accent line
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 38, pageWidth, 2, "F");

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont(undefined, "bold");
  doc.text(title, 15, 20);

  // Subtitle if provided
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(200, 210, 220);
    doc.text(subtitle, 15, 30);
  }
};

// ============================================
// HELPER: Add Professional Footer
// ============================================
const addProfessionalFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont(undefined, "normal");

    doc.text(
      `Generated: ${dayjs().format("DD MMM YYYY HH:mm")}`,
      15,
      pageHeight - 9
    );

    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 25,
      pageHeight - 9
    );

    // Company info
    doc.setTextColor(150, 160, 170);
    doc.setFontSize(7);
    doc.text("NCBA Bank | Confidential", 15, pageHeight - 4);
  }
};

// ============================================
// PDF EXPORT - ENHANCED
// ============================================
export const generatePDFReport = (data, reportType, filters = {}) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 50;

  const title = reportType === "deferrals" ? "Deferrals Report" : "DCL Status Report";
  const subtitle = `Prepared: ${dayjs().format("DD MMM YYYY")}`;

  addProfessionalHeader(doc, title, subtitle);

  // Report Summary Section
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Report Summary", margin, yPosition);

  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...COLORS.text);

  const summaryItems = [
    [`Total Records`, `${data?.length || 0}`],
    [`Report Type`, reportType === "deferrals" ? "Deferrals" : "All DCLs"],
    ...(filters.dateRange && filters.dateRange[0]
      ? [[`Date Range`, `${dayjs(filters.dateRange[0]).format("DD MMM")} - ${dayjs(filters.dateRange[1]).format("DD MMM YYYY")}`]]
      : []),
  ];

  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 2, "F");

  summaryItems.forEach(([label, value], idx) => {
    if (idx % 2 === 0 && idx > 0) yPosition += 6;
    if (idx % 2 === 0) {
      doc.text(label + ":", margin, yPosition);
      doc.setFont(undefined, "bold");
      doc.text(value, margin + 50, yPosition);
      doc.setFont(undefined, "normal");
    } else {
      doc.text(label + ":", pageWidth / 2, yPosition);
      doc.setFont(undefined, "bold");
      doc.text(value, pageWidth / 2 + 50, yPosition);
      doc.setFont(undefined, "normal");
    }
  });

  // Data Table
  yPosition += 12;
  const tableData = formatDataForPDFTable(data, reportType);
  const columns = getTableColumnsForPDF(reportType);

  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: yPosition,
    margin: { top: 30, bottom: 25, left: margin, right: margin },
    didDrawPage: () => addProfessionalFooter(doc),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 4,
      overflow: "linebreak",
      textColor: COLORS.text,
    },
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
      pady: 5,
    },
    alternateRowStyles: {
      fillColor: COLORS.light,
    },
    bodyStyles: {
      lineColor: COLORS.border,
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
    },
  });

  // Download
  const filename = `${reportType}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};

// ============================================
// EXCEL EXPORT
// ============================================
export const generateExcelReport = (data, reportType, filters = {}) => {
  const workbook = XLSX.utils.book_new();

  // Data Sheet
  const excelData = formatDataForExcel(data, reportType);
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Column widths
  const columnWidths = getExcelColumnWidths(reportType);
  worksheet["!cols"] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");

  // Summary Sheet
  const summaryData = generateSummary(data, reportType);
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Download
  const filename = `${reportType}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

// ============================================
// CHART DATA GENERATION
// ============================================
export const generateChartData = (data, reportType) => {
  if (reportType === "deferrals") {
    return generateDeferralCharts(data);
  } else {
    return generateDCLCharts(data);
  }
};

const generateDeferralCharts = (data) => {
  if (!data || !Array.isArray(data)) return {};

  // Status Distribution
  const statusDistribution = {};
  data.forEach((item) => {
    const status = item.status || "unknown";
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });

  const statusChart = Object.entries(statusDistribution).map(([status, count]) => ({
    name: capitalizeWords(status),
    value: count,
  }));

  // Priority Distribution
  const priorityDistribution = {};
  data.forEach((item) => {
    const priority = item.priority || "unknown";
    priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
  });

  const priorityChart = Object.entries(priorityDistribution).map(([priority, count]) => ({
    name: capitalizeWords(priority),
    value: count,
  }));

  // Approval Status
  const approvalStatus = {
    approved: data.filter((d) => d.deferralApprovalStatus === "approved").length,
    pending: data.filter((d) => d.deferralApprovalStatus === "pending").length,
    rejected: data.filter((d) => d.deferralApprovalStatus === "rejected").length,
  };

  const approvalChart = Object.entries(approvalStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: capitalizeWords(status),
      value: count,
    }));

  // Days Remaining Distribution
  const daysRemainingChartData = data
    .filter((d) => d.daysRemaining !== undefined)
    .map((d) => ({
      name: d.deferralNumber || `DEF-${d._id?.slice(-4)}`,
      daysRemaining: d.daysRemaining,
    }))
    .slice(0, 15); // Limit to 15 for chart clarity

  // RM Distribution
  const rmDistribution = {};
  data.forEach((item) => {
    const rmName = item.assignedRM?.name || "Unassigned";
    rmDistribution[rmName] = (rmDistribution[rmName] || 0) + 1;
  });

  const rmChart = Object.entries(rmDistribution)
    .map(([rm, count]) => ({
      name: rm,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    statusChart,
    priorityChart,
    approvalChart,
    daysRemainingChartData,
    rmChart,
  };
};

const generateDCLCharts = (data) => {
  if (!data || !Array.isArray(data)) return {};

  // Status Distribution
  const statusDistribution = {};
  data.forEach((item) => {
    const status = item.status || "unknown";
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });

  const statusChart = Object.entries(statusDistribution).map(([status, count]) => ({
    name: capitalizeWords(status),
    value: count,
  }));

  // Loan Type Distribution
  const loanTypeDistribution = {};
  data.forEach((item) => {
    const loanType = item.loanType || "unknown";
    loanTypeDistribution[loanType] = (loanTypeDistribution[loanType] || 0) + 1;
  });

  const loanTypeChart = Object.entries(loanTypeDistribution)
    .map(([type, count]) => ({
      name: type,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Documents Count Distribution
  const docCountChartData = data
    .map((d) => {
      const totalDocs = d.documents?.reduce(
        (total, cat) => total + (cat.docList?.length || 0),
        0
      ) || 0;
      return {
        name: d.dclNo || `DCL-${d._id?.slice(-4)}`,
        documents: totalDocs,
      };
    })
    .sort((a, b) => b.documents - a.documents)
    .slice(0, 15);

  // RM Assignment
  const rmDistribution = {};
  data.forEach((item) => {
    const rmName = item.assignedToRM?.name || "Unassigned";
    rmDistribution[rmName] = (rmDistribution[rmName] || 0) + 1;
  });

  const rmChart = Object.entries(rmDistribution)
    .map(([rm, count]) => ({
      name: rm,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Creator Distribution
  const creatorDistribution = {};
  data.forEach((item) => {
    const creatorName = item.createdBy?.name || "Unknown";
    creatorDistribution[creatorName] = (creatorDistribution[creatorName] || 0) + 1;
  });

  const creatorChart = Object.entries(creatorDistribution)
    .map(([creator, count]) => ({
      name: creator,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    statusChart,
    loanTypeChart,
    docCountChartData,
    rmChart,
    creatorChart,
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDataForPDFTable = (data, reportType) => {
  if (!data) return [];

  if (reportType === "deferrals") {
    return data.map((item) => [
      item.deferralNumber || "N/A",
      item.customerNumber || "N/A",
      item.customerName || "N/A",
      item.documentName || "N/A",
      item.priority || "N/A",
      item.status || "N/A",
      item.daysRemaining ?? "N/A",
      item.assignedRM?.name || "N/A",
    ]);
  } else {
    return data.map((item) => [
      item.dclNo || "N/A",
      item.customerNumber || "N/A",
      item.customerName || "N/A",
      item.loanType || "N/A",
      item.status || "N/A",
      item.createdBy?.name || "N/A",
      item.assignedToRM?.name || "N/A",
      item.documents?.reduce((total, cat) => total + (cat.docList?.length || 0), 0) || 0,
    ]);
  }
};

const formatDataForExcel = (data, reportType) => {
  if (!data) return [];

  if (reportType === "deferrals") {
    return data.map((item) => ({
      "Deferral Number": item.deferralNumber || "N/A",
      "Customer Number": item.customerNumber || "N/A",
      "Customer Name": item.customerName || "N/A",
      "Document Name": item.documentName || "N/A",
      "Loan Type": item.loanType || "N/A",
      Priority: item.priority || "N/A",
      Status: item.status || "N/A",
      "Days Remaining": item.daysRemaining ?? "N/A",
      "Days Overdue": item.daysOverdue ?? 0,
      "Assigned RM": item.assignedRM?.name || "N/A",
      "Created At": dayjs(item.createdAt).format("DD MMM YYYY HH:mm"),
      "Expiry Date": dayjs(item.slaExpiry).format("DD MMM YYYY"),
    }));
  } else {
    return data.map((item) => ({
      "DCL Number": item.dclNo || "N/A",
      "Customer Number": item.customerNumber || "N/A",
      "Customer Name": item.customerName || "N/A",
      "IBPS Number": item.ibpsNo || "N/A",
      "Loan Type": item.loanType || "N/A",
      Status: item.status || "N/A",
      "Created By": item.createdBy?.name || "N/A",
      "Assigned RM": item.assignedToRM?.name || "N/A",
      "Total Documents": item.documents?.reduce(
        (total, cat) => total + (cat.docList?.length || 0),
        0
      ) || 0,
      "Created At": dayjs(item.createdAt).format("DD MMM YYYY HH:mm"),
      "Updated At": dayjs(item.updatedAt).format("DD MMM YYYY HH:mm"),
    }));
  }
};

const getTableColumnsForPDF = (reportType) => {
  if (reportType === "deferrals") {
    return [
      "Deferral #",
      "Customer #",
      "Customer Name",
      "Document",
      "Priority",
      "Status",
      "Days Left",
      "RM",
    ];
  } else {
    return ["DCL #", "Cust #", "Customer", "Loan Type", "Status", "Creator", "RM", "Docs"];
  }
};

const getExcelColumnWidths = (reportType) => {
  if (reportType === "deferrals") {
    return [
      { wch: 15 }, // Deferral Number
      { wch: 15 }, // Customer Number
      { wch: 20 }, // Customer Name
      { wch: 20 }, // Document
      { wch: 12 }, // Loan Type
      { wch: 12 }, // Priority
      { wch: 12 }, // Status
      { wch: 12 }, // Days Left
      { wch: 12 }, // Days Overdue
      { wch: 15 }, // RM
      { wch: 18 }, // Created At
      { wch: 15 }, // Expiry
    ];
  } else {
    return [
      { wch: 15 }, // DCL Number
      { wch: 15 }, // Customer Number
      { wch: 20 }, // Customer Name
      { wch: 15 }, // IBPS
      { wch: 15 }, // Loan Type
      { wch: 12 }, // Status
      { wch: 15 }, // Creator
      { wch: 15 }, // RM
      { wch: 12 }, // Docs
      { wch: 18 }, // Created
      { wch: 18 }, // Updated
    ];
  }
};

const generateSummary = (data, reportType) => {
  if (!data || !Array.isArray(data)) return [];

  const summary = {
    "Total Records": data.length,
    "Generated On": dayjs().format("DD MMM YYYY HH:mm"),
  };

  if (reportType === "deferrals") {
    summary["Approved"] = data.filter(
      (d) => d.deferralApprovalStatus === "approved"
    ).length;
    summary["Pending"] = data.filter(
      (d) => d.deferralApprovalStatus === "pending"
    ).length;
    summary["Rejected"] = data.filter(
      (d) => d.deferralApprovalStatus === "rejected"
    ).length;
    summary["High Priority"] = data.filter((d) => d.priority === "high").length;
    summary["Average Days Remaining"] = (
      data.reduce((sum, d) => sum + (d.daysRemaining || 0), 0) / data.length
    ).toFixed(1);
  } else {
    summary["Approved"] = data.filter((d) => d.status === "approved").length;
    summary["Active"] = data.filter((d) => d.status === "active").length;
    summary["Completed"] = data.filter((d) => d.status === "completed").length;
    summary["Average Documents"] = (
      data.reduce(
        (sum, d) =>
          sum +
          (d.documents?.reduce(
            (total, cat) => total + (cat.docList?.length || 0),
            0
          ) || 0),
        0
      ) / data.length
    ).toFixed(1);
  }

  return Object.entries(summary).map(([key, value]) => ({
    Metric: key,
    Value: value,
  }));
};

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// ============================================
// MODAL PDF EXPORTS - UNIFIED APPROACH
// ============================================

/**
 * Generate Checklist PDF with consistent professional formatting
 */
const normalizeChecklistPdfArgs = (documentStats = {}, comments = []) => {
  const normalizedStats =
    documentStats && !Array.isArray(documentStats) && typeof documentStats === "object"
      ? documentStats
      : {};

  if (Array.isArray(comments)) {
    return { documentStats: normalizedStats, comments };
  }

  if (Array.isArray(documentStats)) {
    return { documentStats: {}, comments: documentStats };
  }

  if (Array.isArray(comments?.data)) {
    return { documentStats: normalizedStats, comments: comments.data };
  }

  return { documentStats: normalizedStats, comments: [] };
};

const cleanChecklistCommentText = (message) => {
  if (!message || typeof message !== "string") return "";
  return message
    .replace(/^(RM|Co-Creator|Checker|Creator|Approver|System)\s+(Comment|Message|Note):\s*/i, "")
    .replace(/^(Returned by Co-Creator|Rejected by Co-Checker|DCL rejected by checker|Status updated to.*?by checker):\s*/i, "")
    .trim();
};

const formatChecklistUserName = (value) => {
  if (!value) return "N/A";
  return String(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const extractChecklistCommentMessage = (comment) =>
  comment?.message ||
  comment?.text ||
  comment?.comment ||
  comment?.content ||
  comment?.notes ||
  comment?.Comment ||
  comment?.Message ||
  "";

const extractChecklistCommentRole = (comment) => {
  if (comment?.role) return comment.role;
  if (comment?.user?.role) return comment.user.role;
  if (comment?.userId?.role) return comment.userId.role;
  if (comment?.createdBy?.role) return comment.createdBy.role;
  if (comment?.authorRole) return comment.authorRole;
  if (comment?.author?.role) return comment.author.role;
  return comment?.userRole || "";
};

const extractChecklistCommentUserName = (comment) =>
  comment?.userId?.name ||
  comment?.user?.name ||
  comment?.userName ||
  comment?.authorName ||
  comment?.author?.name ||
  comment?.createdBy?.name ||
  comment?.name ||
  comment?.user ||
  "N/A";

const extractChecklistCommentDate = (comment, checklist) =>
  comment?.createdAt ||
  comment?.timestamp ||
  comment?.date ||
  comment?.updatedAt ||
  checklist?.updatedAt ||
  checklist?.createdAt ||
  null;

const isSystemChecklistComment = (message) => {
  if (!message) return true;
  const text = String(message).toLowerCase().trim();
  if (!text) return true;

  if (
    /^(rm|co-creator|cocreator|co creator|checker|creator|approver|customer)\s+(comment|message|note):/i.test(text)
  ) {
    return false;
  }

  const wrappedUserComment = /^(returned by|rejected by|dcl rejected by)[^:]*:\s*(.+)$/i.exec(text);
  if (wrappedUserComment && wrappedUserComment[2].trim().length > 0) {
    return false;
  }

  const patterns = [
    "submitted to",
    "returned to",
    "approved by",
    "rejected by",
    "completed",
    "status updated",
    "status changed",
    "initiated",
    "submitted for",
    "sent to",
    "assigned to",
    "checklist updated",
    "documents updated",
    "checklist submitted",
    "checklist moved",
    "auto-generated",
    "document uploaded",
    "supporting document",
  ];

  return patterns.some((pattern) => text.includes(pattern));
};

const buildChecklistCommentRows = (checklist, comments = []) => {
  const filteredComments = (Array.isArray(comments) ? comments : [])
    .filter((comment) => {
      const role = String(extractChecklistCommentRole(comment) || "").toLowerCase();
      if (role === "system") return false;
      return !isSystemChecklistComment(extractChecklistCommentMessage(comment));
    })
    .map((comment) => ({
      userName: formatChecklistUserName(extractChecklistCommentUserName(comment)),
      role: String(extractChecklistCommentRole(comment) || "N/A").toLowerCase(),
      date: extractChecklistCommentDate(comment, checklist),
      message: cleanChecklistCommentText(extractChecklistCommentMessage(comment)),
    }))
    .filter((comment) => comment.message);

  const addIfMissing = (entry) => {
    if (!entry?.message) return;
    const normalizedMessage = entry.message.trim().toLowerCase();
    if (!normalizedMessage) return;

    const exists = filteredComments.some((comment) => comment.message.trim().toLowerCase() === normalizedMessage);
    if (!exists) {
      filteredComments.push(entry);
    }
  };

  const originalRemarks = checklist?.creatorComment || checklist?.generalComment || checklist?.creatorComments || "";
  const rmRemarks = checklist?.rmGeneralComment || checklist?.rmComment || "";

  addIfMissing({
    userName: formatChecklistUserName(checklist?.createdBy?.name || "CO Creator"),
    role: "cocreator",
    date: checklist?.createdAt || checklist?.updatedAt || null,
    message: cleanChecklistCommentText(originalRemarks),
  });

  addIfMissing({
    userName: formatChecklistUserName(checklist?.assignedToRM?.name || checklist?.rmName || "RM"),
    role: "rm",
    date: checklist?.updatedAt || checklist?.createdAt || null,
    message: cleanChecklistCommentText(rmRemarks),
  });

  filteredComments.sort((left, right) => {
    const leftTime = left.date ? new Date(left.date).getTime() : 0;
    const rightTime = right.date ? new Date(right.date).getTime() : 0;
    return leftTime - rightTime;
  });

  return filteredComments.map((comment) => {
    let formattedRole = comment.role.charAt(0).toUpperCase() + comment.role.slice(1);
    if (comment.role === "cocreator" || comment.role === "creator") formattedRole = "CO Creator";
    if (comment.role === "cochecker" || comment.role === "checker") formattedRole = "CO Checker";
    if (comment.role === "rm") formattedRole = "RM";

    return [
      comment.userName || "N/A",
      formattedRole || "N/A",
      comment.date ? dayjs(comment.date).format("DD/MM/YYYY HH:mm") : "N/A",
      comment.message,
    ];
  });
};

export const generateChecklistPDF = (
  checklist,
  docs = [],
  documentStats = {},
  comments = [],
  options = { save: true, commentTrailOnFinalPage: false }
) => {
  const doc = new jsPDF("p", "mm", "a4", { putOnlyUsedFonts: true, compress: true });
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN_LEFT = 15;
  const MARGIN_RIGHT = 15;
  const NCBA_DARK = [26, 54, 54];
  const NCBA_MID = [64, 83, 76];
  const NCBA_ACCENT = [214, 189, 152];
  const NCBA_LIGHT = [245, 247, 244];
  const STATUS_BLUE = [0, 81, 158];

  const { documentStats: normalizedStats, comments: normalizedComments } = normalizeChecklistPdfArgs(documentStats, comments);

  const resolveExactStatus = (doc) => {
    if (!doc) return "pending";
    const fields = [doc.coStatus, doc.action, doc.status, doc.rmStatus, doc.checkerStatus];
    for (const field of fields) {
      if (field) {
        const normalized = String(field).trim().toLowerCase();
        if (normalized === "pendingrm" || normalized === "pendingco" || normalized === "submitted" ||
          normalized === "waived" || normalized === "sighted" || normalized === "deferred" ||
          normalized === "tbo" || normalized === "approved" || normalized === "completed" ||
          normalized === "rejected") {
          return normalized;
        }
      }
    }
    const rawStatus = doc.coStatus || doc.action || doc.status || doc.rmStatus || doc.checkerStatus || "pending";
    return String(rawStatus).trim().toLowerCase();
  };

  const stats = {
    total: normalizedStats.total ?? docs.length,
    submitted:
      normalizedStats.submitted ??
      docs.filter((item) => ["submitted", "approved", "completed", "sighted", "waived", "tbo"].includes(resolveExactStatus(item))).length,
    pendingFromRM:
      normalizedStats.pendingFromRM ??
      docs.filter((item) => resolveExactStatus(item) === "pendingrm").length,
    pendingFromCo:
      normalizedStats.pendingFromCo ??
      docs.filter((item) => resolveExactStatus(item) === "pendingco").length,
    deferred:
      normalizedStats.deferred ??
      docs.filter((item) => resolveExactStatus(item) === "deferred").length,
    sighted:
      normalizedStats.sighted ??
      docs.filter((item) => resolveExactStatus(item) === "sighted").length,
    waived:
      normalizedStats.waived ??
      docs.filter((item) => resolveExactStatus(item) === "waived").length,
    tbo:
      normalizedStats.tbo ??
      docs.filter((item) => resolveExactStatus(item) === "tbo").length,
  };

  const supportingDocs = docs.filter((item) => item.fileUrl || item.url);

  const addFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let index = 1; index <= totalPages; index += 1) {
      doc.setPage(index);
      doc.setFillColor(...NCBA_LIGHT);
      doc.rect(0, PAGE_HEIGHT - 12, PAGE_WIDTH, 12, "F");

      try {
        if (ncbaLogoPNG) {
          const logoWidth = 28;
          const logoHeight = 9;
          doc.addImage(ncbaLogoPNG, "PNG", PAGE_WIDTH - MARGIN_RIGHT - logoWidth, 10, logoWidth, logoHeight);
        }
      } catch (error) {
        console.warn("Could not add logo to checklist PDF footer/header:", error);
      }

      doc.setFontSize(7);
      doc.setTextColor(...NCBA_MID);
      doc.setFont("helvetica", "normal");

      const generatedBy = checklist?.createdBy?.name || "System";
      const generatedOn = dayjs().format("DD/MM/YYYY HH:mm:ss");

      doc.text(`Page ${index} of ${totalPages}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 5, { align: "center" });
      doc.text(`Generated by ${generatedBy} on ${generatedOn}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 5, { align: "right" });
    }
  };

  const addSectionTitle = (title, y) => {
    doc.setFillColor(...NCBA_LIGHT);
    doc.rect(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, 7, "F");
    doc.setFillColor(...NCBA_ACCENT);
    doc.rect(MARGIN_LEFT, y, 3, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NCBA_DARK);
    doc.text(title.toUpperCase(), MARGIN_LEFT + 6, y + 5);
    return y + 10;
  };

  const formatText = (value) => {
    if (!value) return "N/A";
    let normalized = String(value).trim();
    normalized = normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
    normalized = normalized.replace(/_/g, " ");
    if (!normalized) return "N/A";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  };

  const formatStatusForDisplay = (value) => {
    if (!value) return "Pending";
    const normalized = String(value).toLowerCase().trim();
    if (normalized.includes("pendinggrm")) return "Pending";
    if (normalized === "pendingfromcustomer") return "Pending from customer";
    if (normalized === "submittedforreview") return "Submitted for review";
    if (normalized === "pendingrm") return "Pending RM";
    if (normalized === "pendingco") return "Pending CO";
    if (normalized === "submitted") return "Submitted";
    if (normalized === "waived") return "Waived";
    if (normalized === "sighted") return "Sighted";
    if (normalized === "deferred") return "Deferred";
    if (normalized === "tbo") return "Tbo";
    if (normalized === "approved") return "Approved";
    if (normalized === "completed") return "Completed";
    if (normalized === "rejected") return "Rejected";
    return formatText(value);
  };

  const formatExpiryStatusForPdf = (item) => {
    const category = String(item.category || "").toLowerCase().trim();
    if (category !== "compliance documents") return "—";
    if (!item.expiryDate) return "No expiry set";

    const today = dayjs().startOf("day");
    const expiry = dayjs(item.expiryDate).startOf("day");
    if (!expiry.isValid()) return "No expiry set";

    const diffDays = expiry.diff(today, "day");
    if (diffDays < 0) {
      const absoluteDays = Math.abs(diffDays);
      return `Expired - Overdue by ${absoluteDays} day${absoluteDays === 1 ? "" : "s"}`;
    }
    if (diffDays > 0) {
      return `Current - Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    }
    return "Current - Due today";
  };

  const renderInfoLine = (label, value, y) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NCBA_DARK);
    doc.text(label, MARGIN_LEFT + 5, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...NCBA_MID);
    doc.text(value || "N/A", MARGIN_LEFT + 65, y + 4);
    return y + 7;
  };

  let yPos = 42;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DOCUMENT CHECKLIST REVIEW REPORT", PAGE_WIDTH / 2, 22, { align: "center" });

  const statusValue = (checklist?.status || "UNKNOWN").replace(/_/g, " ").toUpperCase();
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const statusLabel = "CURRENT STATUS: ";
  const fullStatusLine = statusLabel + statusValue;
  const lineWidth = doc.getTextWidth(fullStatusLine);
  const startX = (PAGE_WIDTH - lineWidth) / 2;
  doc.text(statusLabel, startX, 30);
  doc.setTextColor(...STATUS_BLUE);
  doc.text(statusValue, startX + doc.getTextWidth(statusLabel), 30);

  yPos = addSectionTitle("1. CHECKLIST INFORMATION", yPos);
  yPos = renderInfoLine("DCL Number:", checklist?.dclNo || checklist?._id || "N/A", yPos);
  yPos = renderInfoLine("IBPS Number:", checklist?.ibpsNo || checklist?.ibpsNumber || "Not provided", yPos);
  yPos = renderInfoLine("Loan Type:", checklist?.loanType || "N/A", yPos);
  yPos = renderInfoLine("Created By:", checklist?.createdBy?.name || "N/A", yPos);
  yPos = renderInfoLine("Creation Date:", checklist?.createdAt ? dayjs(checklist.createdAt).format("YYYY-MM-DD") : "N/A", yPos);
  yPos = renderInfoLine("Relationship Manager:", checklist?.assignedToRM?.name || checklist?.rmName || "N/A", yPos);

  yPos += 6;
  yPos = addSectionTitle("2. DOCUMENT SUMMARY", yPos);
  yPos += 2;

  autoTable(doc, {
    startY: yPos,
    margin: { top: 30, bottom: 25, left: MARGIN_LEFT, right: MARGIN_RIGHT },
    theme: "grid",
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [...NCBA_DARK],
      fontStyle: "bold",
      lineWidth: 0.1,
      lineColor: [224, 224, 224],
      halign: "center",
      fontSize: 8,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: "center",
      textColor: [...NCBA_MID],
    },
    head: [["Total", "Submitted", "Pending RM", "Pending Co", "Deferred", "Sighted", "Waived", "TBO"]],
    body: [[
      stats.total,
      stats.submitted,
      stats.pendingFromRM,
      stats.pendingFromCo,
      stats.deferred,
      stats.sighted,
      stats.waived,
      stats.tbo,
    ]],
    columnStyles: {
      0: { cellWidth: 22.5 },
      1: { cellWidth: 22.5 },
      2: { cellWidth: 22.5 },
      3: { cellWidth: 22.5 },
      4: { cellWidth: 22.5 },
      5: { cellWidth: 22.5 },
      6: { cellWidth: 22.5 },
      7: { cellWidth: 22.5 },
    },
  });

  yPos = doc.lastAutoTable.finalY + 12;
  yPos = addSectionTitle("3. DOCUMENT DETAILS", yPos);
  yPos += 2;

  const documentRows = docs.map((item) => [
    (item.category || "N/A").toUpperCase(),
    item.name || item.documentName || "N/A",
    formatStatusForDisplay(resolveExactStatus(item)),
    formatStatusForDisplay(item.rmStatus || "pending_from_customer"),
    formatStatusForDisplay(item.checkerStatus || item.finalCheckerStatus || "PENDING"),
    formatText(item.coComment || item.comment || "OK"),
    formatExpiryStatusForPdf(item),
  ]);

  autoTable(doc, {
    startY: yPos,
    margin: { top: 30, bottom: 25, left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [["CATEGORY", "DOCUMENT NAME", "CO STATUS", "RM STATUS", "CHECKER STATUS", "CO COMMENT", "EXPIRY STATUS"]],
    body: documentRows,
    theme: "grid",
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [...NCBA_DARK],
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      font: "helvetica",
      valign: "middle",
      textColor: [...NCBA_MID],
    },
    columnStyles: {
      0: { cellWidth: 25, overflow: "linebreak" },
      1: { cellWidth: 40, overflow: "linebreak" },
      2: { cellWidth: 22, halign: "center", overflow: "linebreak" },
      3: { cellWidth: 30, halign: "center", overflow: "linebreak" },
      4: { cellWidth: 20, halign: "center", overflow: "linebreak" },
      5: { cellWidth: 25, overflow: "linebreak" },
      6: { cellWidth: 18, halign: "center", overflow: "linebreak" },
    },
    willDrawCell: (data) => {
      if ((data.column.index === 2 || data.column.index === 3 || data.column.index === 4) && data.section === "body") {
        const status = (data.cell.text[0] || "").toUpperCase();
        if (status.includes("APPROVED")) {
          data.cell.styles.textColor = [34, 139, 34];
          data.cell.styles.fontStyle = "bold";
        } else if (status.includes("SUBMITTED") || status.includes("SIGHTED")) {
          data.cell.styles.textColor = [0, 0, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  if (supportingDocs.length > 0) {
    if (yPos > PAGE_HEIGHT - 40) {
      doc.addPage();
      yPos = 20;
    }
    yPos = addSectionTitle(`4. SUPPORTING DOCUMENTS (${supportingDocs.length})`, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      margin: { top: 30, bottom: 25, left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [["Document Name", "Uploaded At", "Status"]],
      body: supportingDocs.map((item) => [
        item.name || item.documentName || "N/A",
        item.uploadedAt || item.createdAt ? dayjs(item.uploadedAt || item.createdAt).format("YYYY-MM-DD HH:mm") : "N/A",
        "Uploaded",
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [...NCBA_DARK],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 3, textColor: [...NCBA_MID] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30, halign: "center" },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  const commentRows = buildChecklistCommentRows(checklist, normalizedComments);

  if (commentRows.length > 0) {
    if (options.commentTrailOnFinalPage) {
      doc.addPage();
      yPos = 20;
    } else if (yPos > PAGE_HEIGHT - 50) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSectionTitle("5. COMMENT TRAIL & HISTORY", yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      margin: { top: 30, bottom: 25, left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [["User", "Role", "Date", "Comment"]],
      body: commentRows,
      theme: "striped",
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [...NCBA_DARK],
        fontSize: 8,
        fontStyle: "bold",
        halign: "left",
        lineWidth: 0,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineWidth: 0,
        textColor: [...NCBA_MID],
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: "bold" },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: PAGE_WIDTH - (2 * MARGIN_LEFT) - 90 },
      },
    });
  }

  addFooter();

  const filename = `Checklist_${checklist?.dclNo || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  const blob = doc.output("blob");
  if (options.save !== false) {
    doc.save(filename);
  }
  return blob;
};

// Convenience: return a Blob instead of triggering a download
export const generateChecklistPDFBlob = async (checklist, docs = [], documentStats = {}, comments = [], options = {}) => {
  const normalized = normalizeChecklistPdfArgs(documentStats, comments);
  return generateChecklistPDF(checklist, docs, normalized.documentStats, normalized.comments, {
    save: false,
    ...options,
  });
};

/**
 * Generate Deferral PDF with consistent formatting
 */
export const generateDeferralPDF = (deferral, selectedApprovers = []) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 50;

  addProfessionalHeader(doc, "Deferral Request", deferral?.deferralNumber || "DEF");
  doc.setTextColor(...COLORS.text);

  // Deferral Details
  yPosition = 50;
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Deferral Information", margin, yPosition);
  yPosition += 7;

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  const deferralInfo = [
    ["Deferral Number:", deferral?.deferralNumber || "N/A"],
    ["Customer Number:", deferral?.customerNumber || "N/A"],
    ["Customer Name:", deferral?.customerName || "N/A"],
    ["Document Name:", deferral?.documentName || "N/A"],
    ["Priority:", deferral?.priority || "N/A"],
    ["Status:", deferral?.status || "N/A"],
    ["Deferral Reason:", deferral?.reason || "N/A"],
    ["Assigned RM:", deferral?.assignedRM?.name || "N/A"],
    ["Days Remaining:", deferral?.daysRemaining ?? "N/A"],
    ["Expiry Date:", dayjs(deferral?.slaExpiry).format("DD MMM YYYY") || "N/A"],
    ["Created Date:", dayjs(deferral?.createdAt).format("DD MMM YYYY HH:mm") || "N/A"],
  ];

  deferralInfo.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.text(label, margin, yPosition);
    doc.setFont(undefined, "normal");
    doc.text(String(value), 60, yPosition);
    yPosition += 5;
  });

  // Approvers Table
  if (selectedApprovers && selectedApprovers.length > 0) {
    yPosition += 5;
    const approverData = selectedApprovers.map((approver) => [
      approver.name || "N/A",
      approver.email || "N/A",
      approver.approvalStatus || "Pending",
      approver.approvedAt ? dayjs(approver.approvedAt).format("DD MMM YYYY HH:mm") : "-",
    ]);

    autoTable(doc, {
      head: [["Approver Name", "Email", "Status", "Approval Date"]],
      body: approverData,
      startY: yPosition,
      margin: { top: 30, bottom: 25, left: margin, right: margin },
      didDrawPage: () => addProfessionalFooter(doc),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      bodyStyles: {
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
    });
  }

  addProfessionalFooter(doc);

  // Download
  const filename = `Deferral_${deferral?.deferralNumber || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};

/**
 * Generate Audit Logs PDF
 */
export const generateAuditPDF = (logs = [], title = "Audit Log Report") => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 50;

  addProfessionalHeader(doc, title, `Total: ${logs?.length || 0} records`);
  doc.setTextColor(...COLORS.text);

  // Logs Table
  if (logs && logs.length > 0) {
    const logData = logs.slice(0, 100).map((log) => [
      dayjs(log.timestamp || log.createdAt).format("DD MMM HH:mm"),
      log.userName || log.user?.name || "N/A",
      log.action || "N/A",
      log.description || "N/A",
      log.status || "N/A",
    ]);

    autoTable(doc, {
      head: [["Date/Time", "User", "Action", "Description", "Status"]],
      body: logData,
      startY: yPosition,
      margin: { top: 30, bottom: 25, left: margin, right: margin },
      didDrawPage: () => addProfessionalFooter(doc),
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      bodyStyles: {
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
    });
  }

  addProfessionalFooter(doc);

  // Download
  const filename = `${title.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};

/**
 * Generate Statistics/Dashboard PDF
 */
export const generateStatsPDF = (statsData = {}, title = "Statistics Report") => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 50;

  addProfessionalHeader(doc, title, dayjs().format("DD MMM YYYY"));
  doc.setTextColor(...COLORS.text);
  // Stats Table
  const statsEntries = Object.entries(statsData).map(([key, value]) => [
    key,
    String(value),
  ]);

  if (statsEntries.length > 0) {
    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: statsEntries,
      startY: yPosition,
      margin: { top: 30, bottom: 25, left: margin, right: margin },
      didDrawPage: () => addProfessionalFooter(doc),
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      bodyStyles: {
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
    });
  }

  addProfessionalFooter(doc);

  // Download
  const filename = `${title.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};