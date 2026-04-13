import dayjs from "dayjs";
import { getExpiryMeta } from "./documentUtils";

export const generateChecklistPDF = async (checklist, documents, comments = []) => {
  try {
    // Dynamically import jsPDF and html2canvas
    const jsPDF = (await import("jspdf")).default;
    const html2canvas = await import("html2canvas");

    // Create a temporary container for PDF generation
    const pdfContainer = document.createElement("div");
    pdfContainer.style.position = "absolute";
    pdfContainer.style.left = "-9999px";
    pdfContainer.style.top = "0";
    pdfContainer.style.width = "794px"; // A4 width in pixels (210mm)
    pdfContainer.style.padding = "30px 40px";
    pdfContainer.style.backgroundColor = "#ffffff";
    pdfContainer.style.fontFamily = "'Calibri', 'Arial', sans-serif";
    pdfContainer.style.color = "#333333";

    // Bank-style color scheme
    const bankColors = {
      primary: "#164679", // Deep navy blue
      secondary: "#2c5282", // Medium blue
      accent: "#b5d334", // Lime Green (NCBA Accent)
      success: "#047857", // Green
      warning: "#d97706", // Amber
      danger: "#dc2626", // Red
      light: "#f8fafc", // Light blue-gray
      border: "#e2e8f0", // Light border
      text: "#334155", // Dark gray
      textLight: "#64748b", // Medium gray
    };

    // Calculate status colors for PDF
    const getStatusColor = (status) => {
      const statusLower = (status || "").toLowerCase();
      switch (statusLower) {
        case "submitted":
        case "submitted_for_review":
          return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
        case "pendingrm":
        case "pending_from_customer":
          return { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" };
        case "pendingco":
          return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
        case "waived":
          return { bg: "#fff3cd", color: "#856404", border: "#ffc107" };
        case "sighted":
          return { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
        case "deferred":
        case "deferral":
        case "defferal_requested":
          return { bg: "#e0e7ff", color: "#3730a3", border: "#6366f1" };
        case "approved":
          return { bg: "#d4edda", color: "#155724", border: "#28a745" };
        case "rejected":
          return { bg: "#f8d7da", color: "#721c24", border: "#dc3545" };
        case "tbo":
          return { bg: "#f1f5f9", color: "#475569", border: "#94a3b8" };
        default:
          return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
      }
    };

    // Helper for formatting dates
    const formatDate = (date) => (date ? dayjs(date).format("DD MMM YYYY") : "—");

    // Filter and Process Comments
    const processedComments = comments
      .filter((c) => {
        const isSystem = c.role === "system" || c.userId?.name === "System" || c.type === "system";
        return !isSystem && c.message; // Filter out system logs
      })
      // Remove duplicates based on message content
      .filter((c, index, self) =>
        index === self.findIndex((t) => (
          t.message === c.message && t.userId?.name === c.userId?.name
        ))
      );

    // Build the PDF content
    pdfContainer.innerHTML = `
      <style>
        .pdf-header {
            border-bottom: 3px solid ${bankColors.primary};
            padding-bottom: 20px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .header-left {
            display: flex;
            flex-direction: column;
        }
        .bank-logo {
            font-size: 24px;
            font-weight: bold;
            color: ${bankColors.primary};
            margin-bottom: 5px;
        }
        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: ${bankColors.secondary};
        }
        .header-right {
            text-align: right;
        }
        .status-badge-lg {
            background-color: ${bankColors.secondary}; /* Or dynamic based on status */
            color: white;
            padding: 5px 15px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 5px;
        }
        .gen-date {
            font-size: 10px;
            color: ${bankColors.textLight};
        }
       
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: ${bankColors.primary};
          margin-top: 15px;
          margin-bottom: 8px;
          border-bottom: 1px solid ${bankColors.border};
          padding-bottom: 3px;
          text-transform: uppercase;
        }
       
        /* Modal-like Description List */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr); /* 3 columns matches modal */
          gap: 0;
          border: 1px solid ${bankColors.border};
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 15px;
        }
        .info-item {
          padding: 8px 12px;
          border-right: 1px solid ${bankColors.border};
          border-bottom: 1px solid ${bankColors.border};
          background: white;
        }
        /* Remove right border for last item in row if we had strict rows, but grid handles it visually okay usually.
           For perfect borders we might need more CSS, but this is close to AntD Descriptions */
        .info-item:nth-child(3n) {
             border-right: none;
        }
       
        .info-label {
          font-size: 10px;
          color: ${bankColors.textLight};
          margin-bottom: 2px;
        }
        .info-value {
          font-size: 12px;
          font-weight: 600;
          color: ${bankColors.text};
        }

        .document-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin-top: 5px;
        }
        .document-table th {
          background: ${bankColors.light};
          color: ${bankColors.text};
          padding: 6px 8px;
          text-align: left;
          border-bottom: 2px solid ${bankColors.border};
          font-weight: bold;
        }
        .document-table td {
          padding: 6px 8px;
          border-bottom: 1px solid ${bankColors.border};
          vertical-align: top;
        }
        .status-badge {
          padding: 2px 5px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 8px;
          display: inline-block;
          border: 1px solid transparent;
        }

        .comment-trail {
            margin-top: 20px;
            font-size: 10px;
            border-top: 1px solid ${bankColors.border};
            padding-top: 10px;
        }
        .comment-item {
            padding: 4px 0;
            border-bottom: 1px solid ${bankColors.light};
            display: flex;
            gap: 10px;
        }
        .comment-meta {
            font-weight: bold;
            color: ${bankColors.primary};
            white-space: nowrap;
            width: 180px;
            flex-shrink: 0;
        }
        .comment-msg {
            color: ${bankColors.text};
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 9px;
          color: ${bankColors.textLight};
          border-top: 1px solid ${bankColors.border};
          padding-top: 10px;
        }
      </style>

      <div class="pdf-header">
        <div class="header-left">
           <div class="bank-logo">${checklist?.bankName || "NCBA BANK"}</div>
           <div class="report-title">Checklist Review Report</div>
        </div>
        <div class="header-right">
             <div class="status-badge-lg">
                ${(checklist?.status || "Unknown").toUpperCase()}
             </div>
             <div class="gen-date">
               Generated: ${dayjs().format("DD MMM YYYY, HH:mm")}
             </div>
        </div>
      </div>

      <div class="section-title">Checklist Information</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Customer Name</div>
          <div class="info-value">${checklist?.customerName || checklist?.customerNumber || "N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">DCL Number</div>
          <div class="info-value">${checklist?.dclNo || "N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Relationship Manager</div>
          <div class="info-value">${checklist?.assignedToRM?.name || "Unassigned"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Segment</div>
          <div class="info-value">${checklist?.segment || "Corporate"}</div>
        </div>
        <div class="info-item">
           <div class="info-label">Branch</div>
           <div class="info-value">${checklist?.branch || "Head Office"}</div>
         </div>
         <div class="info-item">
           <div class="info-label">Created By</div>
           <div class="info-value">${checklist?.createdBy?.name || "System"}</div>
         </div>
      </div>

      <div class="section-title">Document Details</div>
      <table class="document-table">
        <thead>
          <tr>
            <th width="20%">Category</th>
            <th width="25%">Document Name</th>
            <th width="15%">Status</th>
            <th width="10%">Expiry Status</th>
            <th width="20%">Latest Comment</th>
            <th width="10%">File</th>
          </tr>
        </thead>
        <tbody>
          ${documents
        .map((doc) => {
          const statusColor = getStatusColor(doc.status || doc.rmStatus || doc.checkerStatus);
          const expiryMeta = getExpiryMeta(doc.expiryDate);
          const isComplianceDocument = (doc.category || "").toLowerCase().trim() === "compliance documents";
          const hasFile = doc.fileUrl ? "Yes" : "No";

          return `
              <tr>
                <td>${doc.category || "—"}</td>
                <td>${doc.name || "—"}</td>
                <td>
                  <span class="status-badge" style="background:${statusColor.bg}; color:${statusColor.color}; border-color:${statusColor.border}">
                    ${(doc.status || doc.rmStatus || doc.checkerStatus || "Pending").toUpperCase()}
                  </span>
                </td>
                <td style="line-height: 1.35; font-size: 8px; font-weight: 600; color: ${expiryMeta?.isExpired ? "#991b1b" : "#166534"};">
                  ${!isComplianceDocument ? "—" : expiryMeta ? `${expiryMeta.label} • ${expiryMeta.detail}` : "No expiry set"}
                </td>
                <td>${doc.comment || "—"}</td>
                <td>${hasFile}</td>
              </tr>
              `;
        })
        .join("")}
        </tbody>
      </table>

      ${processedComments.length > 0
        ? `
      <div class="section-title">Comment Trail</div>
      <div class="comment-trail">
        ${processedComments
          .map(
            (c) => `
            <div class="comment-item">
                <div class="comment-meta">
                    ${dayjs(c.createdAt || c.timestamp).format("DD/MM/YY HH:mm")} - ${c.userId?.name || c.userName || "User"
              } (${c.userId?.role || c.role || "User"})
                </div>
                <div class="comment-msg">${c.message}</div>
            </div>
        `
          )
          .join("")}
      </div>
      `
        : ""
      }

      <div class="footer">
        This is a system-generated report. NCBA Group PLC.
      </div>
    `;

    document.body.appendChild(pdfContainer);

    // Wait for DOM to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Convert to canvas then to PDF
    const canvas = await html2canvas.default(pdfContainer, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, "", "FAST");

    // Save
    const fileName = `Checklist_${checklist?.dclNo || "Report"}_${dayjs().format("YYYYMMDD_HHmm")}.pdf`;
    pdf.save(fileName);

    // Cleanup
    document.body.removeChild(pdfContainer);
    return true;

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return false;
  }
};