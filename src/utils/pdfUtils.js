import dayjs from 'dayjs';
import { getExpiryStatus, formatFileSize } from './documentUtils';
import { PRIMARY_BLUE, ACCENT_LIME, SECONDARY_PURPLE } from './constants';

/**
 * Generates HTML content for PDF export
 */
export const generatePDFHtml = ({
  checklist,
  documents = [],
  supportingDocs = [],
  creatorComment = '',
  comments = [],
  stats = {}
}) => {
  const bankColors = {
    primary: PRIMARY_BLUE,
    secondary: SECONDARY_PURPLE,
    accent: ACCENT_LIME,
    success: "#047857",
    warning: "#d97706",
    danger: "#dc2626",
    light: "#f8fafc",
    border: "#e2e8f0",
    text: "#334155",
    textLight: "#64748b",
  };

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "submitted":
        return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
      case "pendingrm":
        return { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" };
      case "pendingco":
        return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
      case "waived":
        return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
      case "sighted":
        return { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
      case "deferred":
        return { bg: "#e0e7ff", color: "#3730a3", border: "#6366f1" };
      case "tbo":
        return { bg: "#f1f5f9", color: "#475569", border: "#94a3b8" };
      default:
        return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const calculateStats = (docs) => {
    const total = docs.length;
    const submitted = docs.filter(d => 
      ["submitted", "sighted", "waived", "tbo"].includes((d.status || "").toLowerCase())
    ).length;
    const pendingFromRM = docs.filter(d => 
      (d.status || "").toLowerCase() === "pendingrm"
    ).length;
    const pendingFromCo = docs.filter(d => 
      (d.status || "").toLowerCase() === "pendingco"
    ).length;
    const deferred = docs.filter(d => 
      (d.status || "").toLowerCase() === "deferred"
    ).length;
    const sighted = docs.filter(d => 
      (d.status || "").toLowerCase() === "sighted"
    ).length;
    const waived = docs.filter(d => 
      (d.status || "").toLowerCase() === "waived"
    ).length;
    const tbo = docs.filter(d => 
      (d.status || "").toLowerCase() === "tbo"
    ).length;

    const totalRelevantDocs = docs.filter(d => 
      !["pendingco"].includes((d.status || "").toLowerCase())
    ).length;
    
    const progressPercent = totalRelevantDocs === 0 ? 0 : 
      Math.round((submitted / totalRelevantDocs) * 100);

    return {
      total,
      submitted,
      pendingFromRM,
      pendingFromCo,
      deferred,
      sighted,
      waived,
      tbo,
      progressPercent,
      totalRelevantDocs
    };
  };

  const documentStats = calculateStats(documents);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Checklist Report - ${checklist?.dclNo || 'DCL'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
          padding: 20px 30px;
          color: #333333;
          background: white;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(0,0,0,0.03);
          font-weight: bold;
          pointer-events: none;
          z-index: 1;
          opacity: 0.7;
        }
        
        .header {
          border-bottom: 3px solid ${bankColors.primary};
          padding-bottom: 20px;
          margin-bottom: 25px;
          position: relative;
          z-index: 2;
        }
        
        .bank-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          background: ${bankColors.primary};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
        }
        
        .bank-info {
          flex: 1;
        }
        
        .bank-name {
          font-size: 24px;
          font-weight: bold;
          color: ${bankColors.primary};
          margin-bottom: 4px;
        }
        
        .bank-tagline {
          font-size: 12px;
          color: ${bankColors.textLight};
          font-weight: 500;
        }
        
        .document-title {
          font-size: 18px;
          font-weight: bold;
          color: ${bankColors.secondary};
          margin-bottom: 8px;
        }
        
        .document-subtitle {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 11px;
          color: ${bankColors.textLight};
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .section {
          margin-bottom: 25px;
          border: 1px solid ${bankColors.border};
          border-radius: 8px;
          padding: 18px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          position: relative;
          z-index: 2;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: ${bankColors.primary};
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${bankColors.accent};
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-title::before {
          content: "▌";
          color: ${bankColors.accent};
          font-size: 16px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .info-item {
          padding: 10px;
          background: ${bankColors.light};
          border-radius: 6px;
          border-left: 3px solid ${bankColors.secondary};
        }
        
        .info-label {
          font-size: 10px;
          color: ${bankColors.textLight};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 12px;
          font-weight: 600;
          color: ${bankColors.text};
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .stat-card {
          padding: 12px 8px;
          border-radius: 6px;
          text-align: center;
          background: ${bankColors.light};
          border: 1px solid ${bankColors.border};
        }
        
        .stat-number {
          font-size: 18px;
          font-weight: bold;
          color: ${bankColors.primary};
          margin: 6px 0;
        }
        
        .stat-label {
          font-size: 9px;
          color: ${bankColors.textLight};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .progress-container {
          margin: 15px 0;
        }
        
        .progress-bar {
          height: 8px;
          background: ${bankColors.border};
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${bankColors.success}, ${bankColors.accent});
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: ${bankColors.textLight};
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 10px;
          table-layout: fixed;
        }
        
        th {
          background: ${bankColors.primary};
          color: white;
          text-align: left;
          padding: 10px 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        
        td {
          padding: 8px;
          border-bottom: 1px solid ${bankColors.border};
          vertical-align: top;
          word-wrap: break-word;
        }
        
        tr:nth-child(even) {
          background: ${bankColors.light};
        }
        
        .doc-status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 600;
          display: inline-block;
          border: 1px solid;
          text-align: center;
          min-width: 70px;
        }
        
        .comment-box {
          background: ${bankColors.light};
          border-left: 4px solid ${bankColors.accent};
          padding: 12px;
          border-radius: 6px;
          margin-top: 10px;
        }
        
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .comment-author {
          font-weight: 600;
          color: ${bankColors.primary};
          font-size: 11px;
        }
        
        .comment-date {
          font-size: 10px;
          color: ${bankColors.textLight};
        }
        
        .supporting-docs {
          margin-top: 15px;
        }
        
        .supporting-doc-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid ${bankColors.border};
          font-size: 11px;
        }
        
        .supporting-doc-item:last-child {
          border-bottom: none;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid ${bankColors.border};
          text-align: center;
          font-size: 10px;
          color: ${bankColors.textLight};
          line-height: 1.6;
          position: relative;
          z-index: 2;
        }
        
        .disclaimer {
          background: ${bankColors.light};
          padding: 10px;
          border-radius: 6px;
          margin-top: 15px;
          font-size: 9px;
          border: 1px solid ${bankColors.border};
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @media print {
          body {
            padding: 10mm;
          }
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <!-- Watermark -->
      <div class="watermark">${checklist?.bankName || "DOCUMENT CHECKLIST"}</div>
      
      <!-- Header -->
      <div class="header">
        <div class="bank-header">
          <div class="logo">${checklist?.bankInitials?.[0] || "N"}</div>
          <div class="bank-info">
            <div class="bank-name">${checklist?.bankName || "NCBA BANK KENYA PLC"}</div>
            <div class="bank-tagline">Document Checklist System | GO FOR IT</div>
          </div>
        </div>
        
        <div class="document-title">Co Checklist Review Report</div>
        <div class="document-subtitle">
          <span>DCL No: <strong>${checklist?.dclNo || "N/A"}</strong></span>
          <span>IBPS No: <strong>${checklist?.ibpsNo || "Not provided"}</strong></span>
          <span>Generated: <strong>${dayjs().format("DD MMM YYYY, HH:mm:ss")}</strong></span>
        </div>
        
        <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
          <div class="status-badge" style="
            background: ${checklist?.status === "co_creator_review" ? "#d1fae5" : "#fef3c7"};
            color: ${checklist?.status === "co_creator_review" ? "#065f46" : "#92400e"};
            border: 2px solid ${checklist?.status === "co_creator_review" ? "#10b981" : "#f59e0b"};
          ">
            ${checklist?.status?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}
          </div>
        </div>
      </div>
      
      <!-- Checklist Information -->
      <div class="section">
        <div class="section-title">📋 Checklist Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">DCL Number</div>
            <div class="info-value">${checklist?.dclNo || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">IBPS Number</div>
            <div class="info-value">${checklist?.ibpsNo || "Not provided"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Loan Type</div>
            <div class="info-value">${checklist?.loanType || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Creation Date</div>
            <div class="info-value">${dayjs(checklist?.createdAt).format("DD MMM YYYY, HH:mm") || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Created By</div>
            <div class="info-value">${checklist?.createdBy?.name || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Relationship Manager</div>
            <div class="info-value">${checklist?.assignedToRM?.name || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Co-Checker</div>
            <div class="info-value">${checklist?.assignedToCoChecker?.name || "Pending Assignment"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Current Status</div>
            <div class="info-value">
              <span style="
                color: ${checklist?.status === "co_creator_review" ? "#10b981" : "#f59e0b"};
                font-weight: 700;
                text-transform: uppercase;
              ">
                ${checklist?.status?.replace(/_/g, " ") || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Document Summary -->
      <div class="section">
        <div class="section-title">📊 Document Summary</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total</div>
            <div class="stat-number">${documentStats.total}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Relevant</div>
            <div class="stat-number" style="color: ${bankColors.success};">${documentStats.totalRelevantDocs}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Completed</div>
            <div class="stat-number" style="color: ${bankColors.success};">${documentStats.submitted}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending RM</div>
            <div class="stat-number" style="color: ${bankColors.warning};">${documentStats.pendingFromRM}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Co</div>
            <div class="stat-number" style="color: #8b5cf6;">${documentStats.pendingFromCo}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Deferred</div>
            <div class="stat-number" style="color: ${bankColors.danger};">${documentStats.deferred}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Sighted</div>
            <div class="stat-number" style="color: #3b82f6;">${documentStats.sighted}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Waived</div>
            <div class="stat-number" style="color: ${bankColors.warning};">${documentStats.waived}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">TBO</div>
            <div class="stat-number" style="color: #06b6d4;">${documentStats.tbo}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Progress</div>
            <div class="stat-number" style="color: ${bankColors.success};">${documentStats.progressPercent}%</div>
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-text">
            <span>Overall Progress:</span>
            <span><strong>${documentStats.progressPercent}%</strong> (${documentStats.submitted}/${documentStats.totalRelevantDocs} documents)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${documentStats.progressPercent}%"></div>
          </div>
          <div style="font-size: 10px; color: ${bankColors.textLight}; margin-top: 8px;">
            Note: ${documentStats.pendingFromCo} document(s) with "pendingco" status excluded from progress calculation
          </div>
        </div>
      </div>
      
      <!-- Document Details -->
      <div class="section">
        <div class="section-title">📄 Document Details</div>
        <table>
          <thead>
            <tr>
              <th width="12%">Category</th>
              <th width="20%">Document Name</th>
              <th width="12%">Status</th>
              <th width="12%">Checker Status</th>
              <th width="15%">Co Comment</th>
              <th width="10%">Expiry Date</th>
              <th width="10%">Validity</th>
              <th width="9%">File</th>
            </tr>
          </thead>
          <tbody>
            ${documents.map((doc, index) => {
              const statusColor = getStatusColor(doc.status);
              const statusLabel = doc.status === "deferred" && doc.deferralNo
                ? `Deferred (${doc.deferralNo})`
                : (doc.status || "N/A").toUpperCase();
              
              const checkerStatusLabel = doc.checkerStatus || doc.finalCheckerStatus
                ? (doc.checkerStatus || doc.finalCheckerStatus || "N/A").toUpperCase()
                : "—";
              
              const expiryStatus = getExpiryStatus(doc.expiryDate);
              const truncatedComment = truncateText(doc.comment, 25);
              
              return `
                <tr>
                  <td style="font-weight: 600; color: ${bankColors.secondary};">
                    ${doc.category || "N/A"}
                  </td>
                  <td>${doc.name || "N/A"}</td>
                  <td>
                    <span class="doc-status" style="
                      background: ${statusColor.bg};
                      color: ${statusColor.color};
                      border-color: ${statusColor.border};
                    ">
                      ${statusLabel}
                    </span>
                  </td>
                  <td>
                    <span class="doc-status" style="
                      background: ${checkerStatusLabel === "APPROVED" ? "#d1fae5" : 
                                   checkerStatusLabel === "REJECTED" ? "#fee2e2" : "#fef3c7"};
                      color: ${checkerStatusLabel === "APPROVED" ? "#065f46" : 
                              checkerStatusLabel === "REJECTED" ? "#991b1b" : "#92400e"};
                      border-color: ${checkerStatusLabel === "APPROVED" ? "#10b981" : 
                                    checkerStatusLabel === "REJECTED" ? "#ef4444" : "#f59e0b"};
                    ">
                      ${checkerStatusLabel}
                    </span>
                  </td>
                  <td title="${doc.comment || "—"}">
                    ${truncatedComment || "—"}
                  </td>
                  <td style="font-family: monospace; font-size: 9px;">
                    ${doc.expiryDate ? dayjs(doc.expiryDate).format("DD/MM/YY") : "—"}
                  </td>
                  <td>
                    ${(() => {
                      if (!expiryStatus) return "—";
                      return `<span class="doc-status" style="
                        background: ${expiryStatus === "current" ? "#d1fae5" : "#fee2e2"};
                        color: ${expiryStatus === "current" ? "#065f46" : "#991b1b"};
                        border-color: ${expiryStatus === "current" ? "#10b981" : "#ef4444"};
                      ">
                        ${expiryStatus === "current" ? "CURRENT" : "EXPIRED"}
                      </span>`;
                    })()}
                  </td>
                  <td style="text-align: center;">
                    ${doc.fileUrl ? "✅" : "❌"}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        <div style="font-size: 10px; color: ${bankColors.textLight}; margin-top: 10px; text-align: center;">
          Showing ${documents.length} documents • Generated on ${dayjs().format("DD MMM YYYY HH:mm")}
        </div>
      </div>
      
      <!-- Supporting Documents -->
      ${supportingDocs.length > 0 ? `
        <div class="section">
          <div class="section-title">📎 Supporting Documents (${supportingDocs.length})</div>
          <div class="supporting-docs">
            ${supportingDocs.map((doc, index) => `
              <div class="supporting-doc-item">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: ${bankColors.primary}; font-weight: 600;">${index + 1}.</span>
                  <div>
                    <div style="font-weight: 600; font-size: 11px;">${doc.name}</div>
                    <div style="font-size: 9px; color: ${bankColors.textLight}; margin-top: 2px;">
                      ${doc.uploadData?.fileSize ? formatFileSize(doc.uploadData.fileSize) : ''} • 
                      Uploaded: ${dayjs(doc.uploadedAt).format("DD MMM YYYY")}
                    </div>
                  </div>
                </div>
                <span class="doc-status" style="
                  background: #dbeafe;
                  color: #1e40af;
                  border-color: #3b82f6;
                  font-size: 8px;
                ">
                  SUPPORTING
                </span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
      
      <!-- Creator Comment -->
      ${creatorComment ? `
        <div class="section">
          <div class="section-title">💬 Creator's Remarks</div>
          <div class="comment-box">
            <div class="comment-header">
              <span class="comment-author">${checklist?.createdBy?.name || "Checklist Creator"}</span>
              <span class="comment-date">${dayjs().format("DD MMM YYYY, HH:mm")}</span>
            </div>
            <div>${creatorComment.replace(/\n/g, "<br>")}</div>
          </div>
        </div>
      ` : ""}
      
      <!-- Comment History -->
      ${comments && comments.length > 0 ? `
        <div class="section">
          <div class="section-title">🔄 Comment History</div>
          <div style="max-height: 200px; overflow-y: auto;">
            ${comments.slice(0, 20).map((comment) => {
              const userDisplay = comment.userId?.name || 
                                 comment.user?.name || 
                                 comment.createdBy?.name || 
                                 comment.username || 
                                 "System User";
              
              const role = comment.role || "";
              const commentDate = comment.createdAt || comment.timestamp;
              const formattedDate = dayjs(commentDate).format("DD/MM/YY HH:mm");
              const commentText = comment.message || comment.content || comment.comment || "";
              
              return `
                <div style="
                  margin-bottom: 6px;
                  padding: 8px 12px;
                  border-bottom: 1px solid ${bankColors.border};
                  font-size: 10px;
                ">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="
                        font-weight: 600;
                        color: ${role.includes("rm") ? "#8b5cf6" : 
                                role.includes("cocreator") ? "#10b981" : 
                                role.includes("cochecker") ? "#f59e0b" : "#64748b"};
                        font-size: 9px;
                        text-transform: uppercase;
                      ">
                        ${role.replace(/_/g, " ") || "USER"}
                      </span>
                      <span style="font-weight: 600; color: ${bankColors.text};">
                        ${userDisplay}
                      </span>
                    </div>
                    <span style="color: ${bankColors.textLight}; font-size: 9px;">
                      ${formattedDate}
                    </span>
                  </div>
                  <div style="
                    color: ${bankColors.text};
                    padding-left: 8px;
                    border-left: 2px solid ${bankColors.border};
                  ">
                    ${commentText.replace(/\n/g, "<br>")}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
          ${comments.length > 20 ? `
            <div style="
              text-align: center;
              font-size: 9px;
              color: ${bankColors.textLight};
              padding: 8px;
              margin-top: 10px;
              border-top: 1px dashed ${bankColors.border};
            ">
              Showing 20 of ${comments.length} comments
            </div>
          ` : ''}
        </div>
      ` : ""}
      
      <!-- Footer -->
      <div class="footer">
        <div>
          <strong>${checklist?.bankName || "NCBA BANK KENYA PLC"}</strong> • 
          Document Checklist Review System v1.0 • 
          Generated by: ${checklist?.createdBy?.name || "System"}
        </div>
        <div class="disclaimer">
          <strong>DISCLAIMER:</strong> This is a system-generated document for internal use only. 
          Any unauthorized reproduction, distribution, or disclosure is strictly prohibited. 
          This document is automatically generated and should be considered as a working draft.
          <br><br>
          <div style="display: flex; justify-content: space-between; font-size: 8px;">
            <span>Generated: ${dayjs().format("DD MMM YYYY, HH:mm:ss")}</span>
            <span>DCL: ${checklist?.dclNo || "N/A"} • IBPS: ${checklist?.ibpsNo || "N/A"}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generates and downloads PDF
 */
export const generatePDF = async ({
  checklist,
  documents,
  supportingDocs,
  creatorComment,
  comments,
  onProgress
}) => {
  try {
    // Dynamically import jsPDF and html2canvas
    const jsPDF = (await import("jspdf")).default;
    const html2canvas = await import("html2canvas");

    onProgress?.(10);
    
    // Generate HTML content
    const htmlContent = generatePDFHtml({
      checklist,
      documents,
      supportingDocs,
      creatorComment,
      comments
    });

    onProgress?.(30);
    
    // Create temporary container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "794px"; // A4 width in pixels at 96 DPI
    container.style.padding = "20px 30px";
    container.style.backgroundColor = "#ffffff";
    container.innerHTML = htmlContent;
    
    document.body.appendChild(container);

    onProgress?.(50);
    
    // Wait for images to load
    await new Promise((resolve) => {
      const images = container.getElementsByTagName("img");
      if (images.length === 0) {
        setTimeout(resolve, 500);
        return;
      }
      
      let loadedImages = 0;
      const totalImages = images.length;
      
      const imageLoaded = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
          resolve();
        }
      };
      
      Array.from(images).forEach((img) => {
        if (img.complete) {
          imageLoaded();
        } else {
          img.addEventListener("load", imageLoaded);
          img.addEventListener("error", imageLoaded); // Handle errors
        }
      });
    });

    onProgress?.(70);
    
    // Convert to canvas
    const canvas = await html2canvas.default(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      width: container.offsetWidth,
      height: container.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure all styles are applied
        const style = clonedDoc.createElement("style");
        style.textContent = `
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    onProgress?.(90);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(canvas, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content overflows
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const fileName = `DCL_${checklist?.dclNo || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
    
    // Save PDF
    pdf.save(fileName);

    // Clean up
    document.body.removeChild(container);

    onProgress?.(100);
    
    return { success: true, fileName };
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Export PDF utility functions
 */
export default {
  generatePDF,
  generatePDFHtml,
};