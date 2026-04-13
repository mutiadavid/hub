import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ncbaLogo from '../assets/NCBA Logo.png';
import { getExpiryMeta } from '../utils/documentUtils';
import { PRIMARY_BLUE, ACCENT_LIME, SECONDARY_PURPLE } from '../utils/constants';

const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user: currentUser } = useSelector((state) => state.auth);

  /**
   * Calculate document statistics for PDF
   */
  const calculateDocumentStats = useCallback((documents) => {
    const total = documents.length;

    // Count by status
    const statusCounts = {
      submitted: 0,
      pendingrm: 0,
      pendingco: 0,
      deferred: 0,
      sighted: 0,
      waived: 0,
      tbo: 0,
      other: 0
    };

    documents.forEach(d => {
      const status = (d.status || "").toLowerCase();
      switch (status) {
        case "submitted": statusCounts.submitted++; break;
        case "pendingrm": statusCounts.pendingrm++; break;
        case "pendingco": statusCounts.pendingco++; break;
        case "deferred": statusCounts.deferred++; break;
        case "sighted": statusCounts.sighted++; break;
        case "waived": statusCounts.waived++; break;
        case "tbo": statusCounts.tbo++; break;
        default: statusCounts.other++; break;
      }
    });

    const submitted = statusCounts.submitted;
    const pendingFromRM = statusCounts.pendingrm;
    const pendingFromCo = statusCounts.pendingco;
    const deferred = statusCounts.deferred;
    const sighted = statusCounts.sighted;
    const waived = statusCounts.waived;
    const tbo = statusCounts.tbo;

    // Completed documents should include all non-pending statuses
    const completedDocs = submitted + sighted + waived + tbo + deferred;
    const incompleteDocs = pendingFromRM + pendingFromCo + statusCounts.other;

    // Total relevant docs excludes only pendingco from progress calculation
    const totalRelevantDocs = total - pendingFromCo;

    // Progress calculation - use completedDocs instead of just submitted
    const progressPercent = totalRelevantDocs === 0 ? 0 :
      Math.round((completedDocs / totalRelevantDocs) * 100);

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
      totalRelevantDocs,
      completedDocs,
      incompleteDocs
    };
  }, []);

  /**
   * Get role color for comment styling
   */
  const getRoleColor = useCallback((role) => {
    const roleLower = (role || "").toLowerCase();
    if (roleLower.includes("rm") || roleLower === "rm") {
      return "#8b5cf6"; // purple
    } else if (roleLower.includes("cocreator") || roleLower.includes("co_creator") || roleLower === "creator" || roleLower === "co creator") {
      return "#10b981"; // green
    } else if (roleLower.includes("cochecker") || roleLower.includes("co_checker") || roleLower === "checker" || roleLower === "co checker") {
      return "#f59e0b"; // orange
    } else if (roleLower.includes("system")) {
      return "#64748b"; // gray
    }
    return "#3b82f6"; // default blue
  }, []);

  /**
   * Get role display text
   */
  const getRoleText = useCallback((role) => {
    const roleLower = (role || "").toLowerCase();
    if (roleLower.includes("rm") || roleLower === "rm") {
      return "RM";
    } else if (roleLower.includes("cocreator") || roleLower.includes("co_creator") || roleLower === "creator" || roleLower === "co creator") {
      return "CREATOR";
    } else if (roleLower.includes("cochecker") || roleLower.includes("co_checker") || roleLower === "checker" || roleLower === "co checker") {
      return "CHECKER";
    } else if (roleLower.includes("system")) {
      return "SYSTEM";
    }
    return "USER";
  }, []);

  /**
   * Extract role from user object or comment
   */
  const extractUserRole = useCallback((comment) => {
    if (comment.role) return comment.role;
    if (comment.user?.role) return comment.user.role;
    if (comment.userId?.role) return comment.userId.role;
    if (comment.createdBy?.role) return comment.createdBy.role;

    const commentText = comment.message || comment.content || comment.comment || "";
    if (commentText.toLowerCase().includes("rm") || commentText.toLowerCase().includes("relationship manager")) {
      return "RM";
    }
    if (commentText.toLowerCase().includes("co-checker") || commentText.toLowerCase().includes("co checker")) {
      return "CHECKER";
    }
    if (commentText.toLowerCase().includes("co-creator") || commentText.toLowerCase().includes("co creator")) {
      return "CREATOR";
    }

    return comment.userRole || "USER";
  }, []);

  /**
   * Get status color text
   */
  const getStatusTextColor = useCallback((status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "submitted": return "#065f46";
      case "pendingrm":
      case "pendinggrm":
        return "#991b1b";
      case "pendingco": return "#92400e";
      case "waived": return "#92400e";
      case "sighted": return "#1e40af";
      case "deferred": return "#3730a3";
      case "tbo": return "#475569";
      default: return "#64748b";
    }
  }, []);

  /**
   * Format status for display
   */
  const formatStatusForDisplay = useCallback((status) => {
    if (!status) return "N/A";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pendinggrm")) return "PENDING";
    switch (statusLower) {
      case "submitted": return "SUBMITTED";
      case "pendingrm": return "PENDING";
      case "pendingco": return "PENDING";
      case "waived": return "WAIVED";
      case "sighted": return "SIGHTED";
      case "deferred": return "DEFERRED";
      case "tbo": return "TBO";
      case "pendingfromcustomer": return "PENDING FROM CUSTOMER";
      case "submittedforreview": return "SUBMITTED FOR REVIEW";
      default: 
        // Return raw case for formatText to handle
        return status;
    }
  }, []);

  /**
   * Format user name with proper capitalization
   */
  const formatUserName = useCallback((name) => {
    if (!name) return "System User";
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  /**
   * Filter out system-generated comments
   */
  const filterSystemComments = useCallback((comments) => {
    if (!comments || comments.length === 0) {
      return [];
    }

    return comments.filter(comment => {
      const userRole = extractUserRole(comment);
      const roleText = getRoleText(userRole);

      // Exclude system role completely
      if (roleText === "SYSTEM") {
        return false;
      }

      const commentText = (comment.message || comment.content || comment.comment || "").toLowerCase().trim();
      if (!commentText) return false;

      // 1. Preserve actual user comments that carry explicit author labels.
      if (
        /^(rm|co-creator|cocreator|co creator|checker|creator|approver|customer)\s+(comment|message|note):/i.test(
          commentText,
        )
      ) {
        return true; // Keep
      }

      // 2. Preserve messages that look like system messages but clearly contain a user comment after a colon
      const hasSubstantiveCommentAfterColon = /^(returned by|rejected by|dcl rejected by)[^:]*:\s*(.+)$/i.exec(commentText);
      if (hasSubstantiveCommentAfterColon && hasSubstantiveCommentAfterColon[2].trim().length > 0) {
        return true; // Keep: It's a wrapped user comment
      }

      // 3. EXTENSIVE list of pure system-generated patterns
      const systemMessagePatterns = [
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

      // Check if comment matches any pure system pattern
      const isSystemMessage = systemMessagePatterns.some(pattern =>
        pattern.test(commentText)
      );

      return !isSystemMessage;
    });
  }, [extractUserRole, getRoleText]);

  /**
   * Generate progress bar HTML for PDF
   */
  const generateProgressBarHTML = useCallback((stats) => {
    const {
      total,
      submitted,
      pendingFromRM,
      pendingFromCo,
      deferred,
      sighted,
      waived,
      tbo,
      progressPercent,
      completedDocs,
      incompleteDocs
    } = stats;

    const completionRatio = total > 0 ? `${completedDocs}/${total}` : '0/0';

    // Colors for PDF
    const primaryBlue = PRIMARY_BLUE || "#2563eb";
    const accentLime = ACCENT_LIME || "#84cc16";
    const warningColor = "#f59e0b";
    const successColor = "#10b981";
    const dangerColor = "#ef4444";
    const infoColor = "#3b82f6";
    const purpleColor = "#8b5cf6";

    return `
      <div style="
        padding: 16px;
        background: #f7f9fc;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        margin-bottom: 18px;
      ">
        <!-- Stats Row -->
        <div style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        ">
          <div style="font-weight: 700; color: ${primaryBlue};">Total: ${total}</div>
          <div style="font-weight: 700; color: green;">Submitted: ${submitted}</div>
          <div style="font-weight: 700; color: ${pendingFromRM > 0 ? warningColor : purpleColor};">
            Pending RM: ${pendingFromRM}
          </div>
          <div style="
            font-weight: 700;
            color: ${purpleColor};
            border: ${pendingFromCo > 0 ? '2px solid ' + purpleColor : 'none'};
            padding: 2px 6px;
            border-radius: 4px;
            background: ${pendingFromCo > 0 ? '#f3f4f6' : 'transparent'};
          ">
            Pending Co: ${pendingFromCo}
          </div>
          <div style="font-weight: 700; color: ${deferred > 0 ? dangerColor : '#374151'};">Deferred: ${deferred}</div>
          <div style="font-weight: 700; color: ${infoColor};">Sighted: ${sighted}</div>
          <div style="font-weight: 700; color: ${warningColor};">Waived: ${waived}</div>
          <div style="font-weight: 700; color: #06b6d4;">TBO: ${tbo}</div>
        </div>

        <!-- Progress Bar Section -->
        <div style="margin-bottom: 8px;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          ">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 12px; color: #666; font-weight: 500;">
                Completion Progress
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="
                font-size: 12px;
                font-weight: 600;
                color: ${primaryBlue};
              ">
                ${progressPercent}%
              </span>
              <span style="font-size: 11px; color: #666;">
                (${completionRatio})
              </span>
            </div>
          </div>
         
          <!-- Progress Bar -->
          <div style="
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
          ">
            <div style="
              height: 100%;
              width: ${progressPercent}%;
              background: linear-gradient(90deg, ${primaryBlue} 0%, ${accentLime} 100%);
              border-radius: 3px;
              transition: width 0.3s ease;
            "></div>
          </div>
         
          <!-- Progress Details -->
          <div style="
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #666;
            margin-top: 8px;
          ">
            <span>✅ Completed: ${completedDocs}</span>
            <span> Incomplete: ${incompleteDocs}</span>
            <span> Progress: ${progressPercent}%</span>
          </div>
         
          <!-- Warning if pending documents exist -->
          ${(pendingFromRM > 0 || pendingFromCo > 0) ? `
            <div style="
              font-size: 10px;
              color: #d97706;
              background-color: #fef3c7;
              padding: 6px 10px;
              border-radius: 4px;
              margin-top: 8px;
              border: 1px solid #f59e0b20;
            ">
              ${pendingFromRM + pendingFromCo} pending document(s) are reducing overall progress
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }, []);

  /**
   * Generate HTML content for PDF with clean bank-style layout
   */
  const generatePDFHtml = useCallback(({
    checklist,
    documents = [],
    supportingDocs = [],
    creatorComment = '',
    comments = []
  }) => {
    const stats = calculateDocumentStats(documents);

    // Filter system comments
    const userComments = filterSystemComments(comments);
    const userCommentsCount = userComments.length;

    // Clean, professional colors matching the sample PDF
    const colors = {
      primary: "#1a365d",      // Dark blue
      secondary: "#2c5282",    // Medium blue
      accent: "#0f766e",       // Teal
      lightBlue: "#e6f2ff",    // Light blue background
      gray: "#6b7280",         // Text gray
      lightGray: "#f9fafb",    // Light background
      border: "#d1d5db",       // Border gray
      success: "#047857",      // Green
      warning: "#d97706",      // Orange
      danger: "#dc2626",       // Red
      white: "#ffffff",
      // New colors for table styling
      subtleBorder: "#e5e7eb", // Lighter border for rows
    };

    const truncateText = (text, maxLength) => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + "...";
    };

    // Function to render comments in clean format
    const renderAllComments = (allComments) => {
      if (!allComments || allComments.length === 0) {
        return '<div style="text-align: center; padding: 20px; color: #666; font-size: 10px;">No comments available</div>';
      }

      // Sort by time (newest first)
      const sortedComments = [...allComments].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });

      return sortedComments.map((comment) => {
        const userName = comment.userId?.name ||
          comment.user?.name ||
          comment.createdBy?.name ||
          comment.username ||
          "System User";

        const userDisplay = formatUserName(userName);
        const userRole = extractUserRole(comment);
        const roleColor = getRoleColor(userRole);
        const roleText = getRoleText(userRole);

        const commentDate = comment.createdAt || comment.timestamp;
        const formattedDate = dayjs(commentDate).format("YYYY-MM-DD HH:mm:ss");
        const commentText = comment.message || comment.content || comment.comment || "";

        return `
          <div style="margin-bottom: 12px; page-break-inside: avoid;">
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="
                color: ${roleColor};
                font-weight: 600;
                font-size: 10px;
                text-transform: uppercase;
                background: ${roleColor}15;
                padding: 2px 8px;
                border-radius: 3px;
                margin-right: 8px;
                border: 1px solid ${roleColor}30;
              ">
                ${roleText}
              </span>
              <span style="font-weight: 600; color: ${colors.primary}; font-size: 11px;">
                ${userDisplay}
              </span>
              <span style="color: ${colors.gray}; font-size: 10px; margin-left: auto;">
                ${formattedDate}
              </span>
            </div>
            <div style="
              font-size: 11px;
              line-height: 1.4;
              color: ${colors.primary};
              padding: 8px 12px;
              background: ${colors.lightGray};
              border-radius: 4px;
              border-left: 3px solid ${roleColor};
            ">
              ${commentText.replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      }).join("");
    };

    // Generate documents table in clean format
    const generateDocumentsTable = (docs) => {
      if (!docs || docs.length === 0) {
        return `
          <div style="
            text-align: center;
            padding: 40px 20px;
            background: ${colors.lightGray};
            border: 1px dashed ${colors.border};
            border-radius: 6px;
            margin: 20px 0;
            color: ${colors.gray};
            font-size: 11px;
          ">
            No documents found
          </div>
        `;
      }

      return `
        <div style="
          border: 1px solid ${colors.subtleBorder};
          border-radius: 8px;
          overflow: hidden;
          margin-top: 8px;
          background: ${colors.white};
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        ">
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            font-family: 'Arial', sans-serif;
          ">
            <thead>
              <tr style="background: ${colors.primary};">
                <table style="
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 10px;
                  background: ${colors.white};
                  table-layout: fixed;
                ">
                  text-transform: uppercase;
                  font-size: 9.5px;
                  letter-spacing: 0.3px;
                        width: 16%;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                ">Category</th>
                <th style="
                  width: 22%;
                  border-right: 1px solid rgba(255, 255, 255, 0.2);
                  padding: 12px 8px;
                  text-align: left;
                  font-weight: 600;
                  color: white;
                  text-transform: uppercase;
                  font-size: 9.5px;
                  letter-spacing: 0.3px;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                ">Document Name</th>
                <th style="
                  width: 13%;
                  border-right: 1px solid rgba(255, 255, 255, 0.2);
                  padding: 12px 8px;
                  text-align: left;
                  font-weight: 600;
                  color: white;
                  text-transform: uppercase;
                  font-size: 9.5px;
                  letter-spacing: 0.3px;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                ">Co Status</th>
                <th style="
                  width: 19%;
                  border-right: 1px solid rgba(255, 255, 255, 0.2);
                  padding: 12px 8px;
                  text-align: left;
                  font-weight: 600;
                  color: white;
                  text-transform: uppercase;
                  font-size: 9.5px;
                  letter-spacing: 0.3px;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                ">RM Status</th>
                <th style="
                  width: 13%;
                  border-right: 1px solid rgba(255, 255, 255, 0.2);
                  padding: 12px 8px;
                  text-align: left;
                  font-weight: 600;
                  color: white;
                  text-transform: uppercase;
                  font-size: 9.5px;
                  letter-spacing: 0.3px;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                ">Checker Status</th>
                <th style="
                  border-right: 1px solid rgba(255, 255, 255, 0.2);
                  padding: 12px 8px;
                  text-align: left;
                  font-weight: 600;
                  color: white;
                  text-transform: uppercase;
                  font-size: 9.5px;
                  letter-spacing: 0.3px;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                ">Co Comment</th>
                <th style="
                  width: 10%;
                  padding: 12px 8px;
                  text-align: left;
                  font-weight: 600;
                  color: white;
                  text-transform: uppercase;
                  font-size: 9.5px;
                  letter-spacing: 0.3px;
                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                ">Expiry Status</th>
              </tr>
            </thead>
            <tbody>
              ${docs.map((doc, index) => {
                const isAlternate = index % 2 === 1;
                const bgColor = isAlternate ? '#f3f4f6' : colors.white;
               
                const docName = doc.name || doc.documentName || "N/A";
                const category = doc.category || "N/A";
                const coAction = doc.action || doc.coAction || "N/A";
                const rmStatus = doc.rmStatus || "PENDING";
                const checkerStatus = doc.checkerStatus || doc.finalCheckerStatus || "APPROVED";
                const coComment = doc.comment || doc.coComment || "—";
                const expiryMeta = getExpiryMeta(doc.expiryDate);
                const isComplianceDocument = (category || "").toLowerCase().trim() === "compliance documents";
                // Get status color
                const getStatusBg = (status) => {
                  const s = (status || "").toLowerCase();
                  if (s.includes("submitted")) return "#dbeafe";
                  if (s.includes("approved")) return "#dcfce7";
                  if (s.includes("pending")) return "#fef3c7";
                  if (s.includes("expired")) return "#fee2e2";
                  if (s.includes("rejected")) return "#fee2e2";
                  return "transparent";
                };

                return `
                  <tr style="background: ${bgColor}; border-bottom: 1px solid ${colors.subtleBorder};">
                    <td style="padding: 10px 8px; border-right: 1px solid ${colors.subtleBorder}; color: ${colors.primary}; font-weight: 500;">
                      ${truncateText(category, 25)}
                    </td>
                    <td style="padding: 10px 8px; border-right: 1px solid ${colors.subtleBorder}; color: ${colors.primary}; font-weight: 500;">
                      ${truncateText(docName, 30)}
                    </td>
                    <td style="padding: 10px 8px; border-right: 1px solid ${colors.subtleBorder};">
                      <span style="
                        background: ${getStatusBg(coAction)};
                        color: ${getStatusTextColor(coAction)};
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-weight: 600;
                        font-size: 9px;
                      ">
                        ${truncateText(formatStatusForDisplay(coAction), 15)}
                      </span>
                    </td>
                    <td style="padding: 10px 8px; border-right: 1px solid ${colors.subtleBorder};">
                      <span style="
                        background: ${getStatusBg(rmStatus)};
                        color: ${getStatusTextColor(rmStatus)};
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-weight: 600;
                        font-size: 9px;
                      ">
                        ${truncateText(formatStatusForDisplay(rmStatus), 15)}
                      </span>
                    </td>
                    <td style="padding: 10px 8px; border-right: 1px solid ${colors.subtleBorder};">
                      <span style="
                        background: ${getStatusBg(checkerStatus)};
                        color: ${getStatusTextColor(checkerStatus)};
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-weight: 600;
                        font-size: 9px;
                      ">
                        ${truncateText(formatStatusForDisplay(checkerStatus), 15)}
                      </span>
                    </td>
                    <td style="padding: 10px 8px; border-right: 1px solid ${colors.subtleBorder}; color: ${colors.gray}; font-size: 9px;">
                      ${truncateText(coComment, 30)}
                    </td>
                    <td style="padding: 10px 8px; color: ${colors.primary}; line-height: 1.35; font-size: 9px; font-weight: 600;">
                      ${!isComplianceDocument ? "—" : expiryMeta ? `<div style="color: ${expiryMeta.isExpired ? "#991b1b" : "#166534"};">${expiryMeta.label} • ${expiryMeta.detail}</div>` : "No expiry set"}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    };

    /**
     * Generate checklist info in plain text format
     */
    const generateChecklistInfo = () => {
      return `
        <div style="
          font-size: 11px;
          line-height: 1.8;
          color: ${colors.primary};
          margin-bottom: 20px;
        ">
          <div style="display: flex; margin-bottom: 4px;">
            <div style="font-weight: 600; width: 160px; color: #4a5568;">DCL Number:</div>
            <div style="font-weight: 400;">${checklist?.dclNo || "N/A"}</div>
          </div>
          <div style="display: flex; margin-bottom: 4px;">
            <div style="font-weight: 600; width: 160px; color: #4a5568;">IBPS Number:</div>
            <div style="font-weight: 400;">${checklist?.ibpsNo || "Not provided"}</div>
          </div>
          <div style="display: flex; margin-bottom: 4px;">
            <div style="font-weight: 600; width: 160px; color: #4a5568;">Loan Type:</div>
            <div style="font-weight: 400;">${checklist?.loanType || "N/A"}</div>
          </div>
          <div style="display: flex; margin-bottom: 4px;">
            <div style="font-weight: 600; width: 160px; color: #4a5568;">Created By:</div>
            <div style="font-weight: 400;">${formatUserName(checklist?.createdBy?.name) || "N/A"}</div>
          </div>
          <div style="display: flex; margin-bottom: 4px;">
            <div style="font-weight: 600; width: 160px; color: #4a5568;">Creation Date:</div>
            <div style="font-weight: 400;">${dayjs(checklist?.createdAt).format("YYYY-MM-DD") || "N/A"}</div>
          </div>
          <div style="display: flex;">
            <div style="font-weight: 600; width: 160px; color: #4a5568;">Relationship Manager:</div>
            <div style="font-weight: 400;">${formatUserName(checklist?.assignedToRM?.name) || "N/A"}</div>
          </div>
        </div>
      `;
    };

    // Create HTML content with clean, professional layout
    const htmlContent = `
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
          }
         
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            color: #333333;
            line-height: 1.4;
            padding: 30px;
            background: ${colors.white};
          }
         
          .page-break {
            page-break-before: always;
            padding-top: 30px;
          }
         
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
         
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 15px;
          }
         
          .header {
            text-align: center;
            margin-bottom: 25px;
          }
         
          .bank-name {
            font-size: 22px;
            font-weight: 700;
            color: #323337;
            margin-bottom: 5px;
          }
         
          .bank-tagline {
            font-size: 12px;
            color: ${colors.gray};
            margin-bottom: 15px;
          }
         
          .document-title {
            font-size: 16px;
            font-weight: 700;
            color: #323337;
            margin: 10px 0;
          }
         
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            text-align: center;
            font-size: 9px;
            color: ${colors.gray};
            page-break-before: avoid;
          }
         
          .disclaimer {
            background: ${colors.lightGray};
            padding: 10px;
            border-radius: 3px;
            margin-top: 10px;
            font-size: 8px;
            border: 1px solid ${colors.border};
          }
         
          table {
            page-break-inside: auto;
          }
         
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
         
          thead {
            display: table-header-group;
          }
         
          tfoot {
            display: table-footer-group;
          }
        </style>
      </head>
      <body>
        <!-- Page 1: Header and Summary -->
        <div class="header" style="position: relative; padding-right: 120px; min-height: 70px;">
          <img src="${ncbaLogo}" alt="NCBA Logo" style="position: absolute; right: 30px; top: 8px; height: 48px; object-fit: contain;" />
          <div class="document-title" style="color: #0000ff; margin-top: 18px;">DOCUMENT CHECKLIST REVIEW REPORT</div>
          <div style="font-size: 11px; color: ${colors.gray}; margin: 15px 0;">
            CURRENT STATUS: <strong style="color: #0000ff;">${checklist?.status?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}</strong>
          </div>
        </div>

        <!-- Checklist Information -->
        <div class="section">
          <div class="section-title">CHECKLIST INFORMATION</div>
          ${generateChecklistInfo()}
        </div>

        <!-- Document Summary -->
        <div class="section">
          <div class="section-title">DOCUMENT SUMMARY</div>
          ${generateProgressBarHTML(stats)}
        </div>

        <!-- Page Break for Document Details -->
        <div class="page-break">
          <!-- Document Details -->
          <div class="section">
            <div class="section-title">DOCUMENT DETAILS</div>
            ${generateDocumentsTable(documents)}
          </div>
        </div>

        <!-- Page Break for Supporting Docs and Comments -->
        <div class="page-break">
          <!-- Supporting Documents -->
          ${supportingDocs.length > 0 ? `
            <div class="section">
              <div class="section-title">SUPPORTING DOCUMENTS (${supportingDocs.length})</div>
              <div style="background: ${colors.lightGray}; border: 1px solid ${colors.border}; border-radius: 4px; padding: 15px;">
                ${supportingDocs.map((doc) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid ${colors.border};">
                    <div>
                      <div style="font-weight: 600; font-size: 11px; color: ${colors.primary};">${doc.name}</div>
                      <div style="font-size: 10px; color: ${colors.gray}; margin-top: 2px;">
                        Uploaded: ${dayjs(doc.uploadedAt).format("YYYY-MM-DD HH:mm")}
                      </div>
                    </div>
                    <span style="font-size: 10px; color: ${colors.success}; font-weight: 600;">✓ Uploaded</span>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}



          <!-- Comment History -->
          <div class="section">
            <div class="section-title">COMMENT TRAIL & HISTORY</div>
            <div style="background: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 4px; padding: 15px;">
              ${userCommentsCount > 0 ?
        renderAllComments(userComments)
        : `
                <div style="text-align: center; padding: 30px; color: ${colors.gray};">
                  <div style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;">💬</div>
                  <div>No user comments available for this checklist</div>
                  <div style="font-size: 10px; margin-top: 5px;">
                    Only user comments are displayed. System-generated comments are filtered out.
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  }, [calculateDocumentStats, getRoleColor, getRoleText, extractUserRole, getStatusTextColor, formatStatusForDisplay, formatUserName, filterSystemComments, generateProgressBarHTML]);

  /**
   * Generate and download PDF using jsPDF primitives for selectable text
   */
  const generatePDF = useCallback(async ({
    checklist,
    documents = [],
    supportingDocs = [],
    creatorComment = '',
    rmComment = '',
    comments = [],
    onProgress
  }) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const updateProgress = (percent) => {
        setProgress(percent);
        onProgress?.(percent);
      };

      updateProgress(10);

      // Initialize PDF (Portrait, A4)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const NCBA_DARK = [26, 54, 54];    // #1A3636
      const NCBA_MID = [64, 83, 76];     // #40534C
      const NCBA_ACCENT = [214, 189, 152]; // #D6BD98
      const NCBA_LIGHT = [245, 247, 244];  // #F5F7F4
      const primaryBlue = [26, 54, 93]; // Deep Navy (#1a365d)

      updateProgress(30);

      // Helper: Add Footer to all pages
      const addFooter = () => {
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          // Background bar - NCBA_LIGHT
          doc.setFillColor(...NCBA_LIGHT);
          doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

          try {
            if (ncbaLogo) {
              const logoWidth = 24;
              const logoHeight = 7;
              // Add logo to header area (top right) on every page
              doc.addImage(ncbaLogo, 'PNG', pageWidth - margin - logoWidth, 8, logoWidth, logoHeight);
            }
          } catch (e) { /* silently skip */ }

          doc.setFontSize(7);
          doc.setTextColor(...NCBA_MID);
          doc.setFont('helvetica', 'normal');
         
          const generatedBy = formatUserName(currentUser?.name || checklist?.createdBy?.name) || "System";
          const generatedOn = dayjs().format("DD/MM/YYYY HH:mm:ss");
         
          // Center
          doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
         
          // Right
          doc.text(`Generated by ${generatedBy} on ${generatedOn}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
        }
      };

      // Helper: Add styled section title
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

      // Header Section - logo now added per-page in addFooter loop above

      // Title (Centered, nudged down to clear logo)
      doc.setTextColor(60, 60, 60); // Dark Gray for title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("DOCUMENT CHECKLIST REVIEW REPORT", pageWidth / 2, 22, { align: 'center' });
     
      // Status (Centered)
      const statusValue = (checklist?.status || 'UNKNOWN').replace(/_/g, " ").toUpperCase();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60); // Dark Gray for status labels
     
      const statusLabel = "CURRENT STATUS: ";
      const statusBlue = [0, 81, 158]; // GeoBuild Status Blue
      const fullStatusLine = statusLabel + statusValue;
      const lineWidth = doc.getTextWidth(fullStatusLine);
      const startX = (pageWidth - lineWidth) / 2;
      
      doc.text(statusLabel, startX, 30);
      doc.setTextColor(statusBlue[0], statusBlue[1], statusBlue[2]); // Blue for status value
      doc.text(statusValue, startX + doc.getTextWidth(statusLabel), 30);
     
      let yPos = 42;

      // 1. Checklist Information Section
      yPos = addSectionTitle("1. CHECKLIST INFORMATION", yPos);

      // List-style Checklist Info with Geo-style spacing
      const renderInfoLine = (label, value) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NCBA_DARK);
        doc.text(label, margin + 5, yPos + 4);
       
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...NCBA_MID);
        doc.text(value || 'N/A', margin + 65, yPos + 4);
        yPos += 7;
      };

      renderInfoLine("DCL Number:", checklist?.dclNo);
      renderInfoLine("IBPS Number:", checklist?.ibpsNo || "Not provided");
      renderInfoLine("Loan Type:", checklist?.loanType);
      renderInfoLine("Created By:", formatUserName(checklist?.createdBy?.name));
      renderInfoLine("Creation Date:", dayjs(checklist?.createdAt).format("YYYY-MM-DD"));
      renderInfoLine("Relationship Manager:", formatUserName(checklist?.assignedToRM?.name));

      yPos += 6;
      updateProgress(50);

      // 2. Document Summary Section
      const stats = calculateDocumentStats(documents);
      yPos = addSectionTitle("2. DOCUMENT SUMMARY", yPos);
      yPos += 2;

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: { 
          fillColor: [230, 230, 230], // Light Gray (GeoBuild style)
          textColor: [...NCBA_DARK], 
          fontStyle: 'bold', 
          lineWidth: 0.1, 
          lineColor: [224, 224, 224],
          halign: 'center',
          fontSize: 8
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 3, 
          halign: 'center',
          textColor: [...NCBA_MID]
        },
        head: [['Total', 'Submitted', 'Pending RM', 'Pending Co', 'Deferred', 'Sighted', 'Waived', 'TBO']],
        body: [[
          stats.total,
          stats.submitted,
          stats.pendingFromRM,
          stats.pendingFromCo,
          stats.deferred,
          stats.sighted,
          stats.waived,
          stats.tbo
        ]],
        columnStyles: {
          0: { cellWidth: 22.5 },
          1: { cellWidth: 22.5 },
          2: { cellWidth: 22.5 },
          3: { cellWidth: 22.5 },
          4: { cellWidth: 22.5 },
          5: { cellWidth: 22.5 },
          6: { cellWidth: 22.5 },
          7: { cellWidth: 22.5 }
        }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      yPos += 5;
      updateProgress(70);

      yPos = doc.lastAutoTable.finalY + 12;
      updateProgress(70);

      // 3. Document Details Section
      yPos = addSectionTitle("3. DOCUMENT DETAILS", yPos);
      yPos += 2;

      const formatText = (text) => {
        if (!text) return 'N/A';
        let s = String(text).trim();
        // Handle camelCase/PascalCase
        s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
        // Handle underscores
        s = s.replace(/_/g, ' ');
        if (s.length === 0) return 'N/A';
        // Proper casing: Pending from customer instead of PENDINGFROMCUSTOMER
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      };

      const docRows = documents.map(d => [
        (d.category || 'N/A').toUpperCase(),
        d.name || d.documentName || 'N/A',
        formatText(formatStatusForDisplay(d.status || d.coStatus || 'PENDING')),
        formatText(formatStatusForDisplay(d.rmStatus || 'COMPLETED')),
        formatText(formatStatusForDisplay(d.checkerStatus || d.finalCheckerStatus || 'PENDING')),
        formatText(d.coComment || d.comment || 'OK'),
        (() => {
          const isComplianceDocument = (d.category || '').toLowerCase().trim() === 'compliance documents';
          if (!isComplianceDocument) return '—';
          const expiryMeta = getExpiryMeta(d.expiryDate);
          return expiryMeta
            ? `${expiryMeta.label} - ${expiryMeta.detail}`
            : 'No expiry set';
        })()
      ]);

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [['CATEGORY', 'DOCUMENT NAME', 'CO STATUS', 'RM STATUS', 'CHECKER STATUS', 'CO COMMENT', 'EXPIRY STATUS']],
        body: docRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [230, 230, 230], // Light Gray (GeoBuild style)
          textColor: [...NCBA_DARK], 
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 3, 
          overflow: 'linebreak',
          font: 'helvetica',
          valign: 'middle',
          textColor: [...NCBA_MID]
        },
        columnStyles: {
          0: { cellWidth: 25, overflow: 'linebreak' },
          1: { cellWidth: 40, overflow: 'linebreak' },
          2: { cellWidth: 22, halign: 'center', overflow: 'linebreak' },
          3: { cellWidth: 30, halign: 'center', overflow: 'linebreak' },
          4: { cellWidth: 20, halign: 'center', overflow: 'linebreak' },
          5: { cellWidth: 25, overflow: 'linebreak' },
          6: { cellWidth: 18, halign: 'center', overflow: 'linebreak' }
        },
        willDrawCell: (data) => {
          if ((data.column.index === 2 || data.column.index === 3 || data.column.index === 4) && data.section === 'body') {
            const status = (data.cell.text[0] || '').toUpperCase();
            if (status.includes('APPROVED')) {
              data.cell.styles.textColor = [34, 139, 34];
              data.cell.styles.fontStyle = 'bold';
            } else if (status.includes('SUBMITTED') || status.includes('SIGHTED')) {
              data.cell.styles.textColor = [0, 0, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      yPos = doc.lastAutoTable.finalY + 15;
      updateProgress(85);

      // 4. Supporting Documents Section
      if (supportingDocs.length > 0) {
        if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
        yPos = addSectionTitle(`4. SUPPORTING DOCUMENTS (${supportingDocs.length})`, yPos);
        yPos += 2;

        autoTable(doc, {
          startY: yPos,
          margin: { left: margin, right: margin },
          head: [['Document Name', 'Uploaded At', 'Status']],
          body: supportingDocs.map(d => [d.name, dayjs(d.uploadedAt).format("YYYY-MM-DD HH:mm"), '✓ Uploaded']),
          theme: 'grid',
          headStyles: { 
            fillColor: [230, 230, 230], // Light Gray (GeoBuild style)
            textColor: [...NCBA_DARK], 
            fontSize: 8, 
            fontStyle: 'bold' 
          },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 50 },
            2: { cellWidth: 30, halign: 'center' }
          }
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // 4. (Removed Standalone Creator's Remarks Section per request)
      // Robustly identify original remarks from multiple sources
      const originalRemarks = creatorComment || checklist?.creatorComment || checklist?.generalComment || "";

      // 5. Comment Trail & History Section
      const rawUserComments = filterSystemComments(comments);
      const userComments = [...rawUserComments];

      // Add original remarks to history if not there (Historical Co-Creator comment)
      if (originalRemarks && !userComments.some(c => (c.message || c.content || c.comment) === originalRemarks)) {
        userComments.unshift({
          user: { name: checklist?.createdBy?.name || "CO Creator" },
          role: "cocreator",
          createdAt: checklist?.createdAt || checklist?.updatedAt || new Date().toISOString(),
          comment: originalRemarks
        });
      }

      // Add current review comment (RM's new comment)
      if (rmComment && 
          rmComment !== originalRemarks && 
          !userComments.some(c => (c.message || c.content || c.comment) === rmComment)) {
        userComments.push({
          user: { name: currentUser?.name || "Current User" },
          role: currentUser?.role || "RM",
          createdAt: new Date().toISOString(),
          comment: rmComment
        });
      }

      if (userComments.length > 0) {
        if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }
        yPos = addSectionTitle("5. COMMENT TRAIL & HISTORY", yPos);
        yPos += 2;

        autoTable(doc, {
          startY: yPos,
          margin: { left: margin, right: margin },
          head: [['User', 'Role', 'Date', 'Comment']],
          body: userComments.map(c => {
            const role = (c.userId?.role || c.role || "N/A").toLowerCase();
            let formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
            if (role === 'cocreator' || role === 'creator') formattedRole = 'CO Creator';
            if (role === 'cochecker') formattedRole = 'CO Checker';
            if (role === 'rm') formattedRole = 'RM';

            const userName = c.userId?.name || c.user?.name || c.createdBy?.name || "N/A";
            
            let rawMessage = c.message || c.content || c.comment || "";
            // Remove common role prefixes and system activity prefixes that wrap comments
            let cleanMessage = rawMessage
              // 1. Remove explicit author labels
              .replace(
                /^(RM|Co-Creator|Cocreator|Co Creator|Checker|Creator|Approver|System|Customer)\s+(Comment|Message|Note):\s*/i,
                ""
              )
              // 2. Remove system activity prefixes that wrap actual user comments
              .replace(
                /^(Returned by Co-Creator|Rejected by Co-Checker|DCL rejected by checker|Status updated to.*?by checker):\s*/i,
                ""
              )
              .trim();

            return [
              formatUserName(userName),
              formattedRole,
              dayjs(c.createdAt || c.timestamp).format("DD/MM/YYYY HH:mm"),
              cleanMessage
            ];
          }),
          theme: 'striped',
          headStyles: { 
            fillColor: [230, 230, 230], // Light Gray (GeoBuild style)
            textColor: [...NCBA_DARK], 
            fontSize: 8, 
            fontStyle: 'bold',
            halign: 'left',
            lineWidth: 0
          },
          styles: { 
            fontSize: 8, 
            cellPadding: 3,
            lineWidth: 0,
            textColor: [...NCBA_MID]
          },
          columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { cellWidth: 25 },
            2: { cellWidth: 30 },
            3: { cellWidth: pageWidth - (2 * margin) - 90 }
          }
        });
      }

      updateProgress(95);
      addFooter();

      const fileName = `DCL_${checklist?.dclNo || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
      doc.save(fileName);

      updateProgress(100);
      message.success("Checklist PDF generated successfully!");

      return { success: true, fileName };
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Failed to generate PDF. Please try again.");
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [calculateDocumentStats, formatUserName, filterSystemComments, getStatusTextColor, formatStatusForDisplay]);

  return {
    isGenerating,
    progress,
    generatePDF,
    generatePDFHtml,
  };
};

export default usePDFGenerator;