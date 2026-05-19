import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import dayjs from "dayjs";
import ncbaLogo from '../assets/NCBA Logo.png';
import {
  getCloseRequestDocumentGroups,
  getDeferralDocumentBuckets,
} from "./deferralDocuments";

// GeoBuild / NCBA Branding Colors
const NCBA_DARK = [26, 54, 54];    // #1A3636
const NCBA_MID = [64, 83, 76];     // #40534C
const NCBA_ACCENT = [214, 189, 152]; // #D6BD98
const NCBA_LIGHT = [245, 247, 244];  // #F5F7F4
const STATUS_BLUE = [0, 81, 158]; // GeoBuild Status Blue

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm:ss") : "N/A";
};

const formatDateOnly = (value) => {
  if (!value) return "N/A";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "N/A";
};

const toSentenceCase = (str) => {
  if (!str) return "N/A";
  const s = String(str).trim().toLowerCase();
  if (!s) return "N/A";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Resolves the next due date for a deferral from various possible fields
 */
const resolveNextDueDate = (deferral, requestedDocsWithDates) => {
  // 1. Prioritize autocalculation: Created At + Days Sought
  const createdAt = deferral?.createdAt || deferral?.CreatedAt || deferral?.dateCreated || deferral?.DateCreated;
  const daysSought = Number(deferral?.daysSought || deferral?.DaysSought || 0);

  if (createdAt && daysSought > 0) {
    const createdDate = dayjs(createdAt);
    if (createdDate.isValid()) {
      return createdDate.add(daysSought, 'days').toISOString();
    }
  }

  // 2. Fallback to existing logic if autocalculation is not possible
  const rootDate = 
    deferral?.nextDueDate || 
    deferral?.NextDueDate || 
    deferral?.nextDocumentDueDate || 
    deferral?.NextDocumentDueDate;
  
  if (rootDate) return rootDate;

  // 3. Document-level fallback
  if (Array.isArray(requestedDocsWithDates) && requestedDocsWithDates.length > 0) {
    const dates = requestedDocsWithDates
      .map(doc => doc.newDueDate || doc.NextDocumentDueDate || doc.nextDocumentDueDate || doc.NextDueDate || doc.nextDueDate)
      .filter(d => d && dayjs(d).isValid())
      .map(d => dayjs(d));
    
    if (dates.length > 0) {
      const minDate = dates.reduce((min, cur) => cur.isBefore(min) ? cur : min, dates[0]);
      return minDate.toISOString();
    }
  }

  return null;
};



const humanizeStatus = (status, fallback = "Pending") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return fallback;
  
  const statusMap = {
    pending_approval: "Pending Approval",
    in_review: "In Review",
    deferral_requested: "Deferral Requested",
    partially_approved: "Partially Approved",
    approved: "Approved",
    deferral_approved: "Deferral Approved",
    rejected: "Rejected",
    deferral_rejected: "Deferral Rejected",
    returned_for_rework: "Returned For Rework",
    returned_by_creator: "Returned By Creator",
    returned_by_checker: "Returned By Checker",
    close_requested: "Close Requested",
    close_requested_creator_approved: "Close Requested (Creator Approved)",
    closed: "Closed",
    deferral_closed: "Deferral Closed",
    closed_by_co: "Closed By Co-Creator",
    closed_by_creator: "Closed By Creator",
  };

  return statusMap[normalized] || normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};



const formatUserName = (name) => {
  if (!name) return "System";
  return name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const buildHistory = (deferral, historyOverride) => {
  if (Array.isArray(historyOverride)) {
    return [...historyOverride].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }
  const events = [];
  if (Array.isArray(deferral?.comments)) {
    deferral.comments.forEach((comment) => {
      events.push({
        user: comment?.author?.name || comment?.authorName || comment?.userName || "User",
        userRole: comment?.author?.role || comment?.authorRole || comment?.role || "User",
        date: comment?.createdAt,
        comment: comment?.text || comment?.comment || "",
      });
    });
  }
  if (Array.isArray(deferral?.history)) {
    deferral.history.forEach((entry) => {
      if (entry?.action === "moved") return;
      events.push({
        user: entry?.userName || entry?.user?.name || entry?.user || "System",
        userRole: entry?.userRole || entry?.user?.role || "System",
        date: entry?.date || entry?.createdAt || entry?.timestamp,
        comment: entry?.comment || entry?.notes || "",
      });
    });
  }
  return events.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
};

const buildRequestedDocsWithDates = (deferral, requestedDocsOverride) => {
  if (Array.isArray(requestedDocsOverride)) return requestedDocsOverride;
  const { requestedDocs } = getDeferralDocumentBuckets(deferral || {});
  return requestedDocs.map((doc) => {
    const requestedDays = doc?.requestedDays || doc?.daysSought || 0;
    const newDueDate = doc?.newDueDate || doc?.nextDocumentDueDate || doc?.nextDueDate || deferral?.nextDocumentDueDate || deferral?.nextDueDate || null;
    return { ...doc, requestedDays, newDueDate };
  });
};

const buildAttachedDocuments = (deferral, closeRequestDocumentsOverride) => {
  const { dclDocs, uploadedDocs } = getDeferralDocumentBuckets(deferral || {});
  const closeRequestDocuments = Array.isArray(closeRequestDocumentsOverride)
    ? closeRequestDocumentsOverride
    : getCloseRequestDocumentGroups(deferral || {});
  const resolveUploadDate = (doc) =>
    doc?.uploadDate || doc?.UploadDate || doc?.uploadedAt || doc?.UploadedAt || doc?.createdAt || doc?.CreatedAt || deferral?.createdAt || deferral?.CreatedAt || deferral?.dateCreated || deferral?.DateCreated || null;
  const documents = [];
  dclDocs.forEach((doc) => { documents.push({ label: doc?.name || "DCL Document", category: "DCL Upload", uploadedAt: resolveUploadDate(doc) }); });
  uploadedDocs.filter((doc) => !doc?.isCloseRequestEvidence).forEach((doc) => { documents.push({ label: doc?.name || "Supporting Document", category: "Additional Document", uploadedAt: resolveUploadDate(doc) }); });
  closeRequestDocuments.forEach((document) => {
    (document?.uploads || []).forEach((upload) => { documents.push({ label: upload?.name || upload?.fileName || document?.documentName || "Close Request Evidence", category: `Close Request Evidence - ${document?.documentName || "Document"}`, uploadedAt: resolveUploadDate(upload) }); });
  });
  if (documents.length === 0 && Array.isArray(deferral?.documents)) {
    deferral.documents.forEach((doc) => { documents.push({ label: doc?.name || "Attached Document", category: "Attached Document", uploadedAt: resolveUploadDate(doc) }); });
  }
  return documents;
};

const getApprovalFlow = (deferral) => {
  const approvers = Array.isArray(deferral?.approverFlow) && deferral.approverFlow.length > 0 ? deferral.approverFlow : Array.isArray(deferral?.approvers) ? deferral.approvers : [];
  return approvers.map((approver, index) => {
    const status = approver?.approved || approver?.approvalStatus === "approved" ? "Approved" : approver?.rejected || approver?.approvalStatus === "rejected" ? "Rejected" : approver?.returned || approver?.approvalStatus === "returned" ? "Returned" : "Pending";
    return {
      key: approver?._id || approver?.id || `${index}`,
      name: approver?.name || approver?.user?.name || approver?.email || `Approver ${index + 1}`,
      role: approver?.role || approver?.designation || approver?.user?.position || "Approver",
      status,
      date: approver?.approvedAt || approver?.approvedDate || approver?.rejectedAt || approver?.returnedAt || null,
    };
  });
};

const getApproverSummary = (approvalFlow) => {
  const total = approvalFlow.length;
  const approved = approvalFlow.filter((approver) => approver.status === "Approved").length;
  return `${approved} of ${total} Approved`;
};

const getLoanAmountText = (deferral) => {
  if (deferral?.loanAmountCategory) return String(deferral.loanAmountCategory);
  if (deferral?.loanAmount !== null && deferral?.loanAmount !== undefined) return String(deferral.loanAmount);
  return "Below 75 million";
};

export const downloadDeferralPdf = async (deferral, options = {}) => {
  if (!deferral) throw new Error("No deferral selected");

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  const titlePrefix = options.titlePrefix || "DEFERRAL REQUEST REPORT";
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const requestedDocsWithDates = buildRequestedDocsWithDates(deferral, options.requestedDocsWithDates);
  const history = buildHistory(deferral, options.history);
  const closeRequestDocuments = Array.isArray(options.closeRequestDocuments) ? options.closeRequestDocuments : getCloseRequestDocumentGroups(deferral || {});
  const attachedDocuments = buildAttachedDocuments(deferral, closeRequestDocuments);
  const approvalFlow = getApprovalFlow(deferral);

  let yPos = 15;

  // Add pages wrapper footer
  const addFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      try {
        if (ncbaLogo) {
          const logoWidth = 24;
          const logoHeight = 7;
          doc.addImage(ncbaLogo, 'PNG', pageWidth - margin - logoWidth, 8, logoWidth, logoHeight);
        }
      // eslint-disable-next-line no-unused-vars
      } catch (error) { /* silently skip */ }

      doc.setFontSize(7);
      doc.setTextColor(...NCBA_MID);
      doc.setFont('helvetica', 'normal');
     
      const generatedBy = formatUserName(currentUser?.name || deferral?.createdBy?.name) || "System";
      const generatedOn = dayjs().format("DD/MM/YYYY HH:mm:ss");
     
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.text(`Generated by ${generatedBy} on ${generatedOn}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }
  };

  const addSectionTitle = (title, y) => {
    doc.setFillColor(...NCBA_LIGHT);
    doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
    doc.setFillColor(...NCBA_ACCENT);
    doc.rect(margin, y, 3, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NCBA_DARK);
    doc.text(title.toUpperCase(), margin + 6, y + 5);
    return y + 10;
  };

  // Header Title
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(titlePrefix.toUpperCase(), pageWidth / 2, 22, { align: 'center' });
 
  // Status
  const statusValue = humanizeStatus(deferral?.status).toUpperCase();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
 
  const statusLabel = "CURRENT STATUS: ";
  const fullStatusLine = statusLabel + statusValue;
  const lineWidth = doc.getTextWidth(fullStatusLine);
  const startX = (pageWidth - lineWidth) / 2;
  
  doc.text(statusLabel, startX, 30);
  doc.setTextColor(...STATUS_BLUE);
  doc.text(statusValue, startX + doc.getTextWidth(statusLabel), 30);
 
  yPos = 42;

  // 1. Customer & Loan Info
  yPos = addSectionTitle("1. CUSTOMER & LOAN INFORMATION", yPos);

  const renderInfoLine = (label, value) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NCBA_DARK);
    doc.text(label, margin + 5, yPos + 4);
   
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NCBA_MID);
    // Truncate long customer names with substring here if needed
    const textData = String(value || 'N/A');
    doc.text(textData, margin + 55, yPos + 4);
    yPos += 7;
  };

  renderInfoLine("Customer Name:", deferral?.customerName || "N/A");
  renderInfoLine("Customer Number:", deferral?.customerNumber || "N/A");
  renderInfoLine("Loan Type:", toSentenceCase(deferral?.loanType));
  renderInfoLine("Loan Amount:", getLoanAmountText(deferral));
  renderInfoLine("DCL Number:", deferral?.dclNo || deferral?.dclNumber || "N/A");
  renderInfoLine("Deferral Number:", deferral?.deferralNumber || "N/A");

  yPos += 3;

  // 2. Deferral Description / Status Outline
  yPos = addSectionTitle("2. DEFERRAL DETAILS", yPos);
  
  renderInfoLine("Days Sought:", `${deferral?.daysSought || deferral?.DaysSought || 0} days`);
  renderInfoLine("Next Due Date:", formatDateOnly(resolveNextDueDate(deferral, options?.requestedDocsWithDates)));
  renderInfoLine("Created At:", formatDateOnly(deferral?.createdAt || deferral?.CreatedAt || deferral?.dateCreated || deferral?.DateCreated));
  renderInfoLine("Approver Status:", getApproverSummary(approvalFlow));
  
  if (deferral?.deferralDescription || deferral?.description) {
      yPos += 3;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NCBA_DARK);
      doc.text("Deferral Description", margin + 5, yPos + 4);
      yPos += 5;
      
      const descLines = doc.splitTextToSize(String(deferral?.deferralDescription || deferral?.description), pageWidth - (margin * 2) - 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...NCBA_MID);
      doc.text(descLines, margin + 5, yPos + 4);
      yPos += (descLines.length * 5) + 5;
  }

  yPos += 6;
  
  // 3. Document(s) To Be Deferred
  if (requestedDocsWithDates.length > 0) {
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 25; }
    yPos = addSectionTitle(`3. DOCUMENT(S) TO BE DEFERRED`, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      margin: { top: 25, left: margin, right: margin },
      head: [['Document Name', 'Requested Days', 'New Due Date']],
      body: requestedDocsWithDates.map(doc => [
        doc?.name || doc?.documentName || "Document",
        `${doc?.requestedDays || doc?.daysSought || 0} days`,
        formatDateOnly(doc?.newDueDate || doc?.nextDocumentDueDate || doc?.nextDueDate)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [...NCBA_DARK], fontStyle: 'bold', fontSize: 8, halign: 'left', lineWidth: 0.1, lineColor: [224, 224, 224] },
      styles: { fontSize: 8, cellPadding: 3, textColor: [...NCBA_MID] },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 40 }, 2: { cellWidth: 40 } }
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
  }

  // 4. Facility Details
  if (Array.isArray(deferral?.facilities) && deferral.facilities.length > 0) {
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 25; }
    yPos = addSectionTitle(`4. FACILITY DETAILS`, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      margin: { top: 25, left: margin, right: margin },
      head: [['Facility Type', "Sanctioned (KES '000)", "Balance (KES '000)", "Headroom (KES '000)"]],
      body: deferral.facilities.map(f => [
        f?.facilityType || f?.type || f?.name || "N/A",
        Number(f?.sanctioned ?? f?.amount ?? 0).toLocaleString(),
        Number(f?.balance ?? 0).toLocaleString(),
        Number(f?.headroom ?? Math.max(0, (f?.sanctioned || f?.amount || 0) - (f?.balance || 0))).toLocaleString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [...NCBA_DARK], fontStyle: 'bold', fontSize: 8, halign: 'left', lineWidth: 0.1, lineColor: [224, 224, 224] },
      styles: { fontSize: 8, cellPadding: 3, textColor: [...NCBA_MID] },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 35 }, 2: { cellWidth: 35 }, 3: { cellWidth: 30 } }
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
  }

  // 5. Attached Documents
  if (attachedDocuments.length > 0) {
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 25; }
    yPos = addSectionTitle(`5. ATTACHED DOCUMENTS`, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      margin: { top: 25, left: margin, right: margin },
      head: [['Document Label', 'Category', 'Upload Date']],
      body: attachedDocuments.map(doc => [
        doc.label,
        doc.category,
        formatDateTime(doc.uploadedAt)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [...NCBA_DARK], fontStyle: 'bold', fontSize: 8, halign: 'left', lineWidth: 0.1, lineColor: [224, 224, 224] },
      styles: { fontSize: 8, cellPadding: 3, textColor: [...NCBA_MID] },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 60 }, 2: { cellWidth: 40 } }
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
  }

  // 5. Approval Flow
  if (approvalFlow.length > 0) {
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 25; }
    yPos = addSectionTitle(`6. APPROVAL FLOW`, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      margin: { top: 25, left: margin, right: margin },
      head: [['Role', 'Approver Name', 'Status', 'Date']],
      body: approvalFlow.map(app => [
        app.role,
        formatUserName(app.name),
        app.status,
        formatDateTime(app.date)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [...NCBA_DARK], fontStyle: 'bold', fontSize: 8, halign: 'left', lineWidth: 0.1, lineColor: [224, 224, 224] },
      styles: { fontSize: 8, cellPadding: 3, textColor: [...NCBA_MID] },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const s = data.cell.raw;
          if (s === "Approved") data.cell.styles.textColor = [46, 125, 50]; // Green
          else if (s === "Rejected") data.cell.styles.textColor = [211, 47, 47]; // Red
          else if (s === "Returned") data.cell.styles.textColor = [237, 108, 2]; // Orange
        }
      },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 65, fontStyle: 'bold' }, 2: { cellWidth: 30 }, 3: { cellWidth: 40 } }
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
  }

  // 6. Comment Trail
  if (history && history.length > 0) {
    if (yPos > pageHeight - 50) { doc.addPage(); yPos = 25; }
    yPos = addSectionTitle(`7. COMMENT TRAIL & HISTORY`, yPos);
    yPos += 2;

    // Filter system comments first just like usePDFGenerator does
    const systemPatterns = [
      /^checklist submitted/i,
      /^submitted to co-?checker/i,
      /^submitted to co-?creator/i,
      /^submitted to rm/i,
      /^returned to rm/i,
      /^returned to co-?creator/i,
      /^approve/i,
      /^reject/i,
      /^status updated/i,
      /^status changed:/i,
      /^checklist moved/i,
      /^checklist created/i,
      /^checklist initiated/i,
      /^assigned to/i,
      /^sent for approval/i,
      /^dcl approved/i,
      /^dcl rejected/i,
      /^dcl \w+ was /i,
      /^document uploaded/i,
      /^documents updated/i,
      /^draft saved/i,
      /^revived from/i,
      /^supporting document/i,
      /^document reference/i,
      /^file uploaded/i,
      /^system:/i,
      /^auto[- ]?generated/i,
      /^automated message/i
    ];

    const userHistory = history.filter(item => {
      const msg = (item.comment || "").toLowerCase().trim();
      if (!msg) return false;
      if (/^(rm|co-creator|cocreator|co creator|checker|creator|approver|customer)\s+(comment|message|note):/i.test(msg)) {
        return true;
      }
      const hasSubstantiveCommentAfterColon = /^(returned by|rejected by|dcl rejected by)[^:]*:\s*(.+)$/i.exec(msg);
      if (hasSubstantiveCommentAfterColon && hasSubstantiveCommentAfterColon[2].trim().length > 0) {
        return true;
      }
      return !systemPatterns.some(pattern => pattern.test(msg));
    });

    if (userHistory.length > 0) {
      autoTable(doc, {
        startY: yPos,
        margin: { top: 25, left: margin, right: margin },
        head: [['User', 'Role', 'Date', 'Comment']],
        body: userHistory.map(item => {
          let cleanMessage = (item.comment || "")
            .replace(/^(RM|Co-Creator|Cocreator|Co Creator|Checker|Creator|Approver|System|Customer)\s+(Comment|Message|Note):\s*/i, "")
            .replace(/^(Returned by Co-Creator|Rejected by Co-Checker|DCL rejected by checker|Status updated to.*?by checker):\s*/i, "")
            .trim();
            
          return [
            formatUserName(item.user),
            item.userRole,
            formatDateTime(item.date),
            cleanMessage
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [230, 230, 230], textColor: [...NCBA_DARK], fontStyle: 'bold', fontSize: 8, halign: 'left', lineWidth: 0 },
        styles: { fontSize: 8, cellPadding: 3, textColor: [...NCBA_MID], lineWidth: 0 },
        columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 }, 3: { cellWidth: pageWidth - (2 * margin) - 90 } }
      });
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...NCBA_MID);
      doc.text("No user comments available for this deferral.", margin + 5, yPos + 6);
    }
  }

  // Finalize
  addFooter();
  doc.save(`Deferral_${deferral?.deferralNumber || "Report"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`);
};

export default downloadDeferralPdf;