// import dayjs from "dayjs";

// export const downloadChecklistAsPDF = async ({
//   checklist,
//   docs,
//   documentStats,
//   rmGeneralComment,
//   comments = [],
// }) => {
//   try {
//     // Dynamically import jsPDF and html2canvas
//     const jsPDF = (await import("jspdf")).default;
//     const html2canvas = await import("html2canvas");

//     // Create a temporary container for PDF generation
//     const pdfContainer = document.createElement("div");
//     pdfContainer.style.position = "absolute";
//     pdfContainer.style.left = "-9999px";
//     pdfContainer.style.top = "0";
//     pdfContainer.style.width = "1123px"; // Wider for landscape A4
//     pdfContainer.style.padding = "15px 20px";
//     pdfContainer.style.backgroundColor = "#ffffff";
//     pdfContainer.style.fontFamily = "'Arial', sans-serif";
//     pdfContainer.style.color = "#333333";

//     // Bank-style color scheme
//     const bankColors = {
//       primary: "#164679",
//       secondary: "#2c5282",
//       accent: "#0f766e",
//       success: "#047857",
//       warning: "#d97706",
//       danger: "#dc2626",
//       light: "#f8fafc",
//       border: "#e2e8f0",
//       text: "#334155",
//       textLight: "#64748b",
//     };

//     // Calculate status colors for PDF
//     const getStatusColor = (status) => {
//       const statusLower = (status || "").toLowerCase();
//       switch (statusLower) {
//         case "submitted":
//         case "submitted_for_review":
//         case "submitted for review":
//           return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
//         case "pending":
//         case "pendingrm":
//         case "pending_from_customer":
//         case "pending from customer":
//           return { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" };
//         case "pendingco":
//           return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
//         case "waived":
//           return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
//         case "sighted":
//           return { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
//         case "deferred":
//         case "deferral":
//         case "defferal_requested":
//         case "deferral requested":
//           return { bg: "#e0e7ff", color: "#3730a3", border: "#6366f1" };
//         case "tbo":
//           return { bg: "#cffafe", color: "#0e7490", border: "#06b6d4" };
//         default:
//           return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
//       }
//     };

//     const getExpiryStatus = (expiryDate) => {
//       if (!expiryDate) return null;
//       const today = dayjs().startOf("day");
//       const expiry = dayjs(expiryDate).startOf("day");
//       return expiry.isBefore(today) ? "expired" : "current";
//     };

//     // Build the PDF content
//     pdfContainer.innerHTML = `
//     <style>
//       * {
//         box-sizing: border-box;
//       }
      
//       .pdf-container {
//         width: 100%;
//         min-height: 100vh;
//         font-size: 12px !important;
//       }
      
//       .pdf-header {
//         border-bottom: 2px solid ${bankColors.primary};
//         padding-bottom: 12px;
//         margin-bottom: 15px;
//       }
     
//       .bank-logo {
//         display: flex;
//         align-items: center;
//         gap: 10px;
//         margin-bottom: 8px;
//       }
     
//       .logo-circle {
//         width: 40px;
//         height: 40px;
//         background: ${bankColors.primary};
//         border-radius: 50%;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         color: white;
//         font-weight: bold;
//         font-size: 18px;
//       }
     
//       .bank-name {
//         font-size: 18px;
//         font-weight: bold;
//         color: ${bankColors.primary};
//       }
     
//       .bank-tagline {
//         font-size: 11px;
//         color: ${bankColors.textLight};
//         margin-top: 2px;
//       }
     
//       .document-title {
//         font-size: 16px;
//         font-weight: bold;
//         color: ${bankColors.secondary};
//         margin-bottom: 4px;
//       }
     
//       .document-subtitle {
//         font-size: 12px;
//         color: ${bankColors.textLight};
//         display: flex;
//         gap: 12px;
//         flex-wrap: wrap;
//       }
     
//       .document-badge {
//         background: ${bankColors.light};
//         padding: 4px 8px;
//         border-radius: 3px;
//         font-size: 11px;
//         display: inline-flex;
//         align-items: center;
//         gap: 4px;
//       }
     
//       .badge-dot {
//         width: 6px;
//         height: 6px;
//         border-radius: 50%;
//       }
     
//       .section-card {
//         background: white;
//         border: 1px solid ${bankColors.border};
//         border-radius: 5px;
//         padding: 12px;
//         margin-bottom: 12px;
//       }
     
//       .section-title {
//         font-size: 14px;
//         font-weight: bold;
//         color: ${bankColors.primary};
//         margin-bottom: 8px;
//         padding-bottom: 5px;
//         border-bottom: 1px solid ${bankColors.light};
//         display: flex;
//         align-items: center;
//         gap: 6px;
//       }
     
//       .section-title::before {
//         content: "▌";
//         color: ${bankColors.accent};
//         font-size: 12px;
//       }
     
//       .info-grid {
//         display: grid;
//         grid-template-columns: repeat(4, 1fr);
//         gap: 10px;
//         margin-bottom: 8px;
//       }
     
//       .info-item {
//         padding: 8px;
//         background: ${bankColors.light};
//         border-radius: 3px;
//         border-left: 2px solid ${bankColors.secondary};
//       }
     
//       .info-label {
//         font-size: 10px;
//         color: ${bankColors.textLight};
//         text-transform: uppercase;
//         margin-bottom: 2px;
//       }
     
//       .info-value {
//         font-size: 12px;
//         font-weight: 600;
//         color: ${bankColors.text};
//       }
     
//       .summary-cards {
//         display: grid;
//         grid-template-columns: repeat(8, 1fr);
//         gap: 8px;
//         margin-bottom: 12px;
//       }
     
//       .summary-card {
//         padding: 8px;
//         border-radius: 4px;
//         text-align: center;
//         background: ${bankColors.light};
//         border: 1px solid ${bankColors.border};
//       }
     
//       .summary-number {
//         font-size: 16px;
//         font-weight: bold;
//         color: ${bankColors.primary};
//         margin: 4px 0;
//       }
     
//       .summary-label {
//         font-size: 9px;
//         color: ${bankColors.textLight};
//         text-transform: uppercase;
//       }
     
//       .progress-bar {
//         height: 6px;
//         background: ${bankColors.border};
//         border-radius: 2px;
//         overflow: hidden;
//         margin: 8px 0;
//       }
     
//       .progress-fill {
//         height: 100%;
//         background: linear-gradient(90deg, ${bankColors.success}, ${bankColors.accent});
//         border-radius: 2px;
//       }
     
//       .progress-text {
//         display: flex;
//         justify-content: space-between;
//         font-size: 11px;
//         color: ${bankColors.textLight};
//       }
     
//       .table-container {
//         overflow-x: auto;
//         margin-top: 10px;
//       }
     
//       .document-table {
//         width: 100%;
//         border-collapse: collapse;
//         font-size: 11px !important;
//         table-layout: fixed;
//         min-width: 1000px;
//       }
     
//       .document-table th {
//         background: ${bankColors.primary};
//         color: white;
//         text-align: left;
//         padding: 8px 10px;
//         font-weight: 600;
//         text-transform: uppercase;
//         letter-spacing: 0.2px;
//         font-size: 10px !important;
//         white-space: nowrap;
//       }
     
//       .document-table td {
//         padding: 8px 10px;
//         border-bottom: 1px solid ${bankColors.border};
//         vertical-align: top;
//         word-wrap: break-word;
//         overflow-wrap: break-word;
//         font-size: 11px !important;
//       }
     
//       .document-table tr:nth-child(even) {
//         background: #fafafa;
//       }
     
//       /* Column widths */
//       .document-table th:nth-child(1),
//       .document-table td:nth-child(1) { width: 12%; min-width: 80px; }
//       .document-table th:nth-child(2),
//       .document-table td:nth-child(2) { width: 20%; min-width: 130px; }
//       .document-table th:nth-child(3),
//       .document-table td:nth-child(3) { width: 10%; min-width: 80px; }
//       .document-table th:nth-child(4),
//       .document-table td:nth-child(4) { width: 14%; min-width: 110px; }
//       .document-table th:nth-child(5),
//       .document-table td:nth-child(5) { width: 10%; min-width: 80px; }
//       .document-table th:nth-child(6),
//       .document-table td:nth-child(6) { width: 10%; min-width: 80px; }
//       .document-table th:nth-child(7),
//       .document-table td:nth-child(7) { width: 10%; min-width: 90px; }
//       .document-table th:nth-child(8),
//       .document-table td:nth-child(8) { width: 8%; min-width: 70px; }
//       .document-table th:nth-child(9),
//       .document-table td:nth-child(9) { width: 6%; min-width: 60px; }
     
//       .status-badge {
//         padding: 3px 8px;
//         border-radius: 8px;
//         font-size: 10px !important;
//         font-weight: 600;
//         display: inline-block;
//         border: 1px solid;
//         white-space: nowrap;
//         text-align: center;
//       }
     
//       .comment-box {
//         background: ${bankColors.light};
//         border-left: 2px solid ${bankColors.accent};
//         padding: 10px;
//         border-radius: 3px;
//         margin-top: 8px;
//         font-size: 12px;
//         line-height: 1.4;
//       }
     
//       .comment-header {
//         display: flex;
//         justify-content: space-between;
//         align-items: center;
//         margin-bottom: 6px;
//       }
     
//       .comment-author {
//         font-weight: 600;
//         color: ${bankColors.primary};
//         font-size: 12px;
//       }
     
//       .comment-date {
//         font-size: 11px;
//         color: ${bankColors.textLight};
//       }
     
//       .watermark {
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%) rotate(-45deg);
//         font-size: 50px;
//         color: rgba(0,0,0,0.03);
//         font-weight: bold;
//         pointer-events: none;
//         z-index: 1;
//       }
     
//       .footer {
//         margin-top: 20px;
//         padding-top: 12px;
//         border-top: 1px solid ${bankColors.border};
//         text-align: center;
//         font-size: 10px;
//         color: ${bankColors.textLight};
//         line-height: 1.4;
//       }
     
//       .disclaimer {
//         background: ${bankColors.light};
//         padding: 8px;
//         border-radius: 2px;
//         margin-top: 8px;
//         font-size: 9px;
//       }
      
//       .expired-tag {
//         background: #fee2e2 !important;
//         color: #991b1b !important;
//         border-color: #ef4444 !important;
//       }
      
//       .current-tag {
//         background: #d1fae5 !important;
//         color: #065f46 !important;
//         border-color: #10b981 !important;
//       }
      
//       .header-content {
//         display: flex;
//         justify-content: space-between;
//         align-items: flex-start;
//         margin-top: 8px;
//         padding-top: 8px;
//         border-top: 1px solid ${bankColors.border};
//       }
      
//       .document-info {
//         flex: 1;
//       }
      
//       .current-status-section {
//         display: flex;
//         flex-direction: column;
//         align-items: flex-end;
//         min-width: 130px;
//       }
      
//       .status-label {
//         font-size: 10px;
//         color: ${bankColors.textLight};
//         text-transform: uppercase;
//         margin-bottom: 4px;
//       }
      
//       .status-display {
//         padding: 6px 12px;
//         border-radius: 3px;
//         font-size: 12px;
//         font-weight: 600;
//         text-align: center;
//         border: 1px solid;
//         min-width: 110px;
//       }
//     </style>

//     <!-- Watermark -->
//     <div class="watermark">${checklist?.bankName || "BANK DOCUMENT"}</div>

//     <!-- Main Container -->
//     <div class="pdf-container">
//       <!-- Header with Bank Logo -->
//       <div class="pdf-header">
//         <div class="bank-logo">
//           <div class="logo-circle">${checklist?.bankInitials || "NCBA"}</div>
//           <div>
//             <div class="bank-name">${
//               checklist?.bankName || "NCBA BANK KENYA PLC"
//             }</div>
//             <div class="bank-tagline">DOCUMENT CHECKLIST REVIEW</div>
//           </div>
//         </div>
       
//         <!-- Document Info and Status Section -->
//         <div class="header-content">
//           <div class="document-info">
//             <div class="document-title">RM Checklist Review Report</div>
//             <div class="document-subtitle">
//               <span class="document-badge">
//                 <span class="badge-dot" style="background: ${
//                   bankColors.primary
//                 }"></span>
//                 DCL: <strong>${checklist?.dclNo || "N/A"}</strong>
//               </span>
//               <span class="document-badge">
//                 <span class="badge-dot" style="background: ${
//                   bankColors.secondary
//                 }"></span>
//                 Customer: <strong>${checklist?.customerNumber || "N/A"}</strong>
//               </span>
//               <span class="document-badge">
//                 <span class="badge-dot" style="background: ${
//                   bankColors.accent
//                 }"></span>
//                 Generated: ${dayjs().format("DD MMM YYYY, HH:mm")}
//               </span>
//               <span class="document-badge">
//                 <span class="badge-dot" style="background: ${
//                   bankColors.success
//                 }"></span>
//                 Documents: <strong>${documentStats.total}</strong>
//               </span>
//             </div>
//           </div>
          
//           <!-- Current Status Display -->
//           <div class="current-status-section">
//             <div class="status-label">Current Status</div>
//             <div class="status-display" style="
//               background: ${
//                 checklist?.status === "rm_review" ? "#fef3c7" : "#d1fae5"
//               };
//               color: ${
//                 checklist?.status === "rm_review" ? "#92400e" : "#065f46"
//               };
//               border-color: ${
//                 checklist?.status === "rm_review" ? "#f59e0b" : "#10b981"
//               };
//             ">
//               ${(checklist?.status || "UNKNOWN").toUpperCase()}
//             </div>
//           </div>
//         </div>
//       </div>

//       <!-- Checklist Information -->
//       <div class="section-card">
//         <div class="section-title">Checklist Information</div>
//         <div class="info-grid">
//           <div class="info-item">
//             <div class="info-label">Customer Number</div>
//             <div class="info-value">${checklist?.customerNumber || "N/A"}</div>
//           </div>
//           <div class="info-item">
//             <div class="info-label">DCL Number</div>
//             <div class="info-value">${checklist?.dclNo || "N/A"}</div>
//           </div>
//           <div class="info-item">
//             <div class="info-label">IBPS Number</div>
//             <div class="info-value">${checklist?.ibpsNo || "—"}</div>
//           </div>
//           <div class="info-item">
//             <div class="info-label">Loan Type</div>
//             <div class="info-value">${checklist?.loanType || "N/A"}</div>
//           </div>
//           <div class="info-item">
//             <div class="info-label">Created By</div>
//             <div class="info-value">${checklist?.createdBy?.name || "N/A"}</div>
//           </div>
//           <div class="info-item">
//             <div class="info-label">Relationship Manager</div>
//             <div class="info-value">${
//               checklist?.assignedToRM?.name || "N/A"
//             }</div>
//           </div>
//           <div class="info-item">
//             <div class="info-label">Co-Checker</div>
//             <div class="info-value">${
//               checklist?.assignedToCoChecker?.name || "Pending"
//             }</div>
//           </div>
//         </div>
//       </div>

//       <!-- Document Summary -->
//       <div class="section-card">
//         <div class="section-title">Document Summary</div>
       
//         <div class="summary-cards">
//           <div class="summary-card">
//             <div class="summary-label">Total</div>
//             <div class="summary-number">${documentStats.total}</div>
//           </div>
//           <div class="summary-card">
//             <div class="summary-label">Submitted</div>
//             <div class="summary-number" style="color: ${bankColors.success};">
//               ${documentStats.submitted}
//             </div>
//           </div>
//           <div class="summary-card">
//             <div class="summary-label">Pending RM</div>
//             <div class="summary-number" style="color: ${bankColors.warning};">
//               ${documentStats.pendingFromRM}
//             </div>
//           </div>
//           <div class="summary-card">
//             <div class="summary-label">Pending Co</div>
//             <div class="summary-number" style="color: #8b5cf6;">
//               ${documentStats.pendingFromCo}
//             </div>
//           </div>
//           <div class="summary-card">
//             <div class="summary-label">Deferred</div>
//             <div class="summary-number" style="color: ${bankColors.danger};">
//               ${documentStats.deferred}
//             </div>
//           </div>
//           <div class="summary-card">
//             <div class="summary-label">Sighted</div>
//             <div class="summary-number" style="color: #3b82f6;">
//               ${documentStats.sighted}
//             </div>
//           </div>
//           <div class="summary-card">
//             <div class="summary-label">Waived</div>
//             <div class="summary-number" style="color: ${bankColors.warning};">
//               ${documentStats.waived}
//             </div>
//           </div>
//           <div class="summary-card">
//             <div class="summary-label">TBO</div>
//             <div class="summary-number" style="color: #06b6d4;">
//               ${documentStats.tbo}
//             </div>
//           </div>
//         </div>
       
//         <div class="progress-text">
//           <span>Completion Progress</span>
//           <span>${documentStats.progressPercent}%</span>
//         </div>
//         <div class="progress-bar">
//           <div class="progress-fill" style="width: ${documentStats.progressPercent}%"></div>
//         </div>
//       </div>

//       <!-- Document Details -->
//       <div class="section-card">
//         <div class="section-title">Document Details (${documentStats.total} documents)</div>
//         <div class="table-container">
//           <table class="document-table">
//             <thead>
//               <tr>
//                 <th>Category</th>
//                 <th>Document Name</th>
//                 <th>CO Status</th>
//                 <th>CO Comment</th>
//                 <th>Expiry Date</th>
//                 <th>Expiry Status</th>
//                 <th>RM Status</th>
//                 <th>Deferral No</th>
//                 <th>File</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${docs
//                 .map((doc, index) => {
//                   const statusColor = getStatusColor(doc.status);
//                   const rmStatusColor = getStatusColor(doc.rmStatus);

//                   let coStatusLabel = "N/A";
//                   if (doc.status) {
//                     if (doc.status === "deferred" && doc.deferralNumber) {
//                       coStatusLabel = `DEFERRED (${doc.deferralNumber})`;
//                     } else {
//                       coStatusLabel = doc.status.toUpperCase();
//                     }
//                   }

//                   let rmStatusLabel = "PENDING";
//                   if (doc.rmStatus) {
//                     if (
//                       doc.rmStatus === "Deferral Requested" &&
//                       doc.deferralNumber
//                     ) {
//                       rmStatusLabel = `DEFERRED (${doc.deferralNumber})`;
//                     } else {
//                       rmStatusLabel = doc.rmStatus.toUpperCase();
//                     }
//                   }

//                   const expiryStatus = getExpiryStatus(doc.expiryDate);
//                   const expiryDate = doc.expiryDate
//                     ? dayjs(doc.expiryDate).format("DD/MM/YYYY")
//                     : "—";

//                   const truncate = (text, max = 40) => {
//                     if (!text || text === "—") return "—";
//                     return text.length > max
//                       ? text.substring(0, max) + "..."
//                       : text;
//                   };

//                   const docName = truncate(doc.name || "—", 35);
//                   const docComment = truncate(doc.comment || "—", 30);
//                   const docCategory = truncate(doc.category || "—", 20);

//                   const hasFile = doc.fileUrl ? "✓" : "—";

//                   return `
//                     <tr>
//                       <td title="${doc.category || "—"}">
//                         ${docCategory}
//                       </td>
//                       <td title="${doc.name || "—"}">
//                         ${docName}
//                       </td>
//                       <td>
//                         <span class="status-badge" style="
//                           background: ${statusColor.bg};
//                           color: ${statusColor.color};
//                           border-color: ${statusColor.border};
//                         ">
//                           ${coStatusLabel.substring(0, 15)}
//                         </span>
//                       </td>
//                       <td title="${doc.comment || "—"}">
//                         ${docComment}
//                       </td>
//                       <td style="font-family: monospace; font-weight: 500;">
//                         ${expiryDate}
//                       </td>
//                       <td>
//                         ${
//                           !expiryStatus
//                             ? "—"
//                             : `<span class="status-badge ${
//                                 expiryStatus === "current"
//                                   ? "current-tag"
//                                   : "expired-tag"
//                               }">
//                                 ${expiryStatus === "current" ? "CURRENT" : "EXPIRED"}
//                               </span>`
//                         }
//                       </td>
//                       <td>
//                         <span class="status-badge" style="
//                           background: ${rmStatusColor.bg};
//                           color: ${rmStatusColor.color};
//                           border-color: ${rmStatusColor.border};
//                         ">
//                           ${rmStatusLabel.substring(0, 15)}
//                         </span>
//                       </td>
//                       <td style="font-family: monospace; font-weight: 600;">
//                         ${doc.deferralNumber || "—"}
//                       </td>
//                       <td style="text-align: center; font-weight: bold; color: ${
//                         hasFile === "✓"
//                           ? bankColors.success
//                           : bankColors.textLight
//                       };">
//                         ${hasFile}
//                       </td>
//                     </tr>
//                   `;
//                 })
//                 .join("")}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <!-- RM General Comment -->
//       ${
//         rmGeneralComment
//           ? `
//         <div class="section-card">
//           <div class="section-title">RM General Comment</div>
//           <div class="comment-box">
//             <div class="comment-header">
//               <span class="comment-author">${
//                 checklist?.assignedToRM?.name || "Relationship Manager"
//               }</span>
//               <span class="comment-date">${dayjs().format("DD MMM YYYY, HH:mm")}</span>
//             </div>
//             <div>${rmGeneralComment}</div>
//           </div>
//         </div>
//       `
//           : ""
//       }

//       <!-- Footer -->
//       <div class="footer">
//         <div>
//           <strong>${checklist?.bankName || "NCBA BANK KENYA PLC"}</strong> • 
//           Document Checklist Review System • 
//           Generated by: ${checklist?.assignedToRM?.name || "System"}
//         </div>
//         <div class="disclaimer">
//           This is a system-generated document. For official purposes only.
//           Any unauthorized reproduction or distribution is strictly prohibited.
//           Generated on ${dayjs().format("DD MMM YYYY, HH:mm:ss")}
//         </div>
//       </div>
//     </div>
//   `;

//     document.body.appendChild(pdfContainer);

//     // Wait for DOM to render
//     await new Promise((resolve) => setTimeout(resolve, 100));

//     // Convert to canvas then to PDF
//     const canvas = await html2canvas.default(pdfContainer, {
//       scale: 1,
//       useCORS: true,
//       logging: false,
//       backgroundColor: "#ffffff",
//       allowTaint: true,
//       width: pdfContainer.offsetWidth,
//       height: pdfContainer.scrollHeight,
//       windowHeight: pdfContainer.scrollHeight,
//     });

//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF({
//       orientation: "landscape",
//       unit: "mm",
//       format: "a4",
//       compress: true,
//     });

//     const imgWidth = 297; // A4 landscape width in mm
//     const pageHeight = 210; // A4 landscape height in mm
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     let heightLeft = imgHeight;
//     let position = 0;

//     // Add first page
//     pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
//     heightLeft -= pageHeight;

//     // Add additional pages if content is longer than one page
//     while (heightLeft > 0) {
//       position = heightLeft - imgHeight;
//       pdf.addPage();
//       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
//       heightLeft -= pageHeight;
//     }

//     // Save the PDF
//     const fileName = `RM_Checklist_${
//       checklist?.customerNumber || checklist?.dclNo || "export"
//     }_${dayjs().format("YYYYMMDD_HHmm")}.pdf`;
//     pdf.save(fileName);

//     // Clean up
//     document.body.removeChild(pdfContainer);

//     return true;
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     throw error;
//   }
// };



import dayjs from "dayjs";

export const downloadChecklistAsPDF = async ({
  checklist,
  docs = [], // Add default empty array
  documentStats, // This might be undefined
  rmGeneralComment,
  comments = [],
}) => {
  try {
    // Dynamically import jsPDF and html2canvas
    const jsPDF = (await import("jspdf")).default;
    const html2canvas = await import("html2canvas");

    // FIX: Add default values for documentStats
    const safeDocumentStats = documentStats || {
      total: docs.length || 0,
      submitted: 0,
      pendingFromRM: 0,
      pendingFromCo: 0,
      deferred: 0,
      sighted: 0,
      waived: 0,
      tbo: 0,
      progressPercent: 100, // Always 100% for completed checklists
    };

    // Also ensure docs is an array
    const safeDocs = Array.isArray(docs) ? docs : [];

    // Create a temporary container for PDF generation
    const pdfContainer = document.createElement("div");
    pdfContainer.style.position = "absolute";
    pdfContainer.style.left = "-9999px";
    pdfContainer.style.top = "0";
    pdfContainer.style.width = "1123px";
    pdfContainer.style.padding = "15px 20px";
    pdfContainer.style.backgroundColor = "#ffffff";
    pdfContainer.style.fontFamily = "'Arial', sans-serif";
    pdfContainer.style.color = "#333333";

    // Bank-style color scheme
    const bankColors = {
      primary: "#164679",
      secondary: "#2c5282",
      accent: "#0f766e",
      success: "#047857",
      warning: "#d97706",
      danger: "#dc2626",
      light: "#f8fafc",
      border: "#e2e8f0",
      text: "#334155",
      textLight: "#64748b",
    };

    // Calculate status colors for PDF
    const getStatusColor = (status) => {
      const statusLower = (status || "").toLowerCase();
      switch (statusLower) {
        case "submitted":
        case "submitted_for_review":
        case "submitted for review":
        case "approved":
        case "completed":
          return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
        case "pending":
        case "pendingrm":
        case "pending_from_customer":
        case "pending from customer":
          return { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" };
        case "pendingco":
          return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
        case "waived":
          return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
        case "sighted":
          return { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
        case "deferred":
        case "deferral":
        case "defferal_requested":
        case "deferral requested":
          return { bg: "#e0e7ff", color: "#3730a3", border: "#6366f1" };
        case "tbo":
          return { bg: "#cffafe", color: "#0e7490", border: "#06b6d4" };
        default:
          return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
      }
    };

    const getExpiryStatus = (expiryDate) => {
      if (!expiryDate) return null;
      const today = dayjs().startOf("day");
      const expiry = dayjs(expiryDate).startOf("day");
      return expiry.isBefore(today) ? "expired" : "current";
    };

    // Build the PDF content - USE safeDocumentStats instead of documentStats
    pdfContainer.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
      }
      
      .pdf-container {
        width: 100%;
        min-height: 100vh;
        font-size: 12px !important;
      }
      
      .pdf-header {
        border-bottom: 2px solid ${bankColors.primary};
        padding-bottom: 12px;
        margin-bottom: 15px;
      }
     
      .bank-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
     
      .logo-circle {
        width: 40px;
        height: 40px;
        background: ${bankColors.primary};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
      }
     
      .bank-name {
        font-size: 18px;
        font-weight: bold;
        color: ${bankColors.primary};
      }
     
      .bank-tagline {
        font-size: 11px;
        color: ${bankColors.textLight};
        margin-top: 2px;
      }
     
      .document-title {
        font-size: 16px;
        font-weight: bold;
        color: ${bankColors.secondary};
        margin-bottom: 4px;
      }
     
      .document-subtitle {
        font-size: 12px;
        color: ${bankColors.textLight};
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
     
      .document-badge {
        background: ${bankColors.light};
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
     
      .badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
     
      .section-card {
        background: white;
        border: 1px solid ${bankColors.border};
        border-radius: 5px;
        padding: 12px;
        margin-bottom: 12px;
      }
     
      .section-title {
        font-size: 14px;
        font-weight: bold;
        color: ${bankColors.primary};
        margin-bottom: 8px;
        padding-bottom: 5px;
        border-bottom: 1px solid ${bankColors.light};
        display: flex;
        align-items: center;
        gap: 6px;
      }
     
      .section-title::before {
        content: "▌";
        color: ${bankColors.accent};
        font-size: 12px;
      }
     
      .info-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 8px;
      }
     
      .info-item {
        padding: 8px;
        background: ${bankColors.light};
        border-radius: 3px;
        border-left: 2px solid ${bankColors.secondary};
      }
     
      .info-label {
        font-size: 10px;
        color: ${bankColors.textLight};
        text-transform: uppercase;
        margin-bottom: 2px;
      }
     
      .info-value {
        font-size: 12px;
        font-weight: 600;
        color: ${bankColors.text};
      }
     
      .summary-cards {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }
     
      .summary-card {
        padding: 8px;
        border-radius: 4px;
        text-align: center;
        background: ${bankColors.light};
        border: 1px solid ${bankColors.border};
      }
     
      .summary-number {
        font-size: 16px;
        font-weight: bold;
        color: ${bankColors.primary};
        margin: 4px 0;
      }
     
      .summary-label {
        font-size: 9px;
        color: ${bankColors.textLight};
        text-transform: uppercase;
      }
     
      .progress-bar {
        height: 6px;
        background: ${bankColors.border};
        border-radius: 2px;
        overflow: hidden;
        margin: 8px 0;
      }
     
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, ${bankColors.success}, ${bankColors.accent});
        border-radius: 2px;
      }
     
      .progress-text {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: ${bankColors.textLight};
      }
     
      .table-container {
        overflow-x: auto;
        margin-top: 10px;
      }
     
      .document-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px !important;
        table-layout: fixed;
        min-width: 1000px;
      }
     
      .document-table th {
        background: ${bankColors.primary};
        color: white;
        text-align: left;
        padding: 8px 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        font-size: 10px !important;
        white-space: nowrap;
      }
     
      .document-table td {
        padding: 8px 10px;
        border-bottom: 1px solid ${bankColors.border};
        vertical-align: top;
        word-wrap: break-word;
        overflow-wrap: break-word;
        font-size: 11px !important;
      }
     
      .document-table tr:nth-child(even) {
        background: #fafafa;
      }
     
      /* Column widths */
      .document-table th:nth-child(1),
      .document-table td:nth-child(1) { width: 12%; min-width: 80px; }
      .document-table th:nth-child(2),
      .document-table td:nth-child(2) { width: 20%; min-width: 130px; }
      .document-table th:nth-child(3),
      .document-table td:nth-child(3) { width: 10%; min-width: 80px; }
      .document-table th:nth-child(4),
      .document-table td:nth-child(4) { width: 14%; min-width: 110px; }
      .document-table th:nth-child(5),
      .document-table td:nth-child(5) { width: 10%; min-width: 80px; }
      .document-table th:nth-child(6),
      .document-table td:nth-child(6) { width: 10%; min-width: 80px; }
      .document-table th:nth-child(7),
      .document-table td:nth-child(7) { width: 10%; min-width: 90px; }
      .document-table th:nth-child(8),
      .document-table td:nth-child(8) { width: 8%; min-width: 70px; }
      .document-table th:nth-child(9),
      .document-table td:nth-child(9) { width: 6%; min-width: 60px; }
     
      .status-badge {
        padding: 3px 8px;
        border-radius: 8px;
        font-size: 10px !important;
        font-weight: 600;
        display: inline-block;
        border: 1px solid;
        white-space: nowrap;
        text-align: center;
      }
     
      .comment-box {
        background: ${bankColors.light};
        border-left: 2px solid ${bankColors.accent};
        padding: 10px;
        border-radius: 3px;
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.4;
      }
     
      .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
     
      .comment-author {
        font-weight: 600;
        color: ${bankColors.primary};
        font-size: 12px;
      }
     
      .comment-date {
        font-size: 11px;
        color: ${bankColors.textLight};
      }
     
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 50px;
        color: rgba(0,0,0,0.03);
        font-weight: bold;
        pointer-events: none;
        z-index: 1;
      }
     
      .footer {
        margin-top: 20px;
        padding-top: 12px;
        border-top: 1px solid ${bankColors.border};
        text-align: center;
        font-size: 10px;
        color: ${bankColors.textLight};
        line-height: 1.4;
      }
     
      .disclaimer {
        background: ${bankColors.light};
        padding: 8px;
        border-radius: 2px;
        margin-top: 8px;
        font-size: 9px;
      }
      
      .expired-tag {
        background: #fee2e2 !important;
        color: #991b1b !important;
        border-color: #ef4444 !important;
      }
      
      .current-tag {
        background: #d1fae5 !important;
        color: #065f46 !important;
        border-color: #10b981 !important;
      }
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid ${bankColors.border};
      }
      
      .document-info {
        flex: 1;
      }
      
      .current-status-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        min-width: 130px;
      }
      
      .status-label {
        font-size: 10px;
        color: ${bankColors.textLight};
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      
      .status-display {
        padding: 6px 12px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        border: 1px solid;
        min-width: 110px;
      }
    </style>

    <!-- Watermark -->
    <div class="watermark">${checklist?.bankName || "COMPLETED CHECKLIST"}</div>

    <!-- Main Container -->
    <div class="pdf-container">
      <!-- Header with Bank Logo -->
      <div class="pdf-header">
        <div class="bank-logo">
          <div class="logo-circle">${checklist?.bankInitials || "NCBA"}</div>
          <div>
            <div class="bank-name">${
              checklist?.bankName || "COMPLETED CHECKLIST REPORT"
            }</div>
            <div class="bank-tagline">Completed Checklist Review</div>
          </div>
        </div>
       
        <!-- Document Info and Status Section -->
        <div class="header-content">
          <div class="document-info">
            <div class="document-title">Completed Checklist Report</div>
            <div class="document-subtitle">
              <span class="document-badge">
                <span class="badge-dot" style="background: ${
                  bankColors.primary
                }"></span>
                DCL: <strong>${checklist?.dclNo || "N/A"}</strong>
              </span>
              <span class="document-badge">
                <span class="badge-dot" style="background: ${
                  bankColors.secondary
                }"></span>
                Customer: <strong>${checklist?.customerNumber || "N/A"}</strong>
              </span>
              <span class="document-badge">
                <span class="badge-dot" style="background: ${
                  bankColors.accent
                }"></span>
                Generated: ${dayjs().format("DD MMM YYYY, HH:mm")}
              </span>
              <span class="document-badge">
                <span class="badge-dot" style="background: ${
                  bankColors.success
                }"></span>
                Documents: <strong>${safeDocumentStats.total}</strong>
              </span>
            </div>
          </div>
          
          <!-- Current Status Display -->
          <div class="current-status-section">
            <div class="status-label">Overall Status</div>
            <div class="status-display" style="
              background: #d1fae5;
              color: #065f46;
              border-color: #10b981;
            ">
              COMPLETED
            </div>
          </div>
        </div>
      </div>

      <!-- Checklist Information -->
      <div class="section-card">
        <div class="section-title">Checklist Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Number</div>
            <div class="info-value">${checklist?.customerNumber || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">DCL Number</div>
            <div class="info-value">${checklist?.dclNo || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">IBPS Number</div>
            <div class="info-value">${checklist?.ibpsNo || "—"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Loan Type</div>
            <div class="info-value">${checklist?.loanType || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Created By</div>
            <div class="info-value">${checklist?.createdBy?.name || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Relationship Manager</div>
            <div class="info-value">${
              checklist?.assignedToRM?.name || "N/A"
            }</div>
          </div>
          <div class="info-item">
            <div class="info-label">Co-Checker</div>
            <div class="info-value">${
              checklist?.assignedToCoChecker?.name || "Pending"
            }</div>
          </div>
          <div class="info-item">
            <div class="info-label">Completed At</div>
            <div class="info-value">${
              checklist?.completedAt
                ? dayjs(checklist.completedAt).format("DD MMM YYYY, HH:mm")
                : dayjs().format("DD MMM YYYY, HH:mm")
            }</div>
          </div>
        </div>
      </div>

      <!-- Document Summary -->
      <div class="section-card">
        <div class="section-title">Document Summary</div>
       
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-label">Total</div>
            <div class="summary-number">${safeDocumentStats.total}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Submitted</div>
            <div class="summary-number" style="color: ${bankColors.success};">
              ${safeDocumentStats.submitted}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Approved</div>
            <div class="summary-number" style="color: ${bankColors.success};">
              ${safeDocumentStats.approved || 0}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Waived</div>
            <div class="summary-number" style="color: ${bankColors.warning};">
              ${safeDocumentStats.waived}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Deferred</div>
            <div class="summary-number" style="color: ${bankColors.danger};">
              ${safeDocumentStats.deferred}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Sighted</div>
            <div class="summary-number" style="color: #3b82f6;">
              ${safeDocumentStats.sighted}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">TBO</div>
            <div class="summary-number" style="color: #06b6d4;">
              ${safeDocumentStats.tbo}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Completed</div>
            <div class="summary-number" style="color: ${bankColors.success};">
              ${safeDocumentStats.completed || safeDocumentStats.total}
            </div>
          </div>
        </div>
       
        <div class="progress-text">
          <span>Completion Progress</span>
          <span>${safeDocumentStats.progressPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${safeDocumentStats.progressPercent}%"></div>
        </div>
        <div style="font-size: 10px; color: ${bankColors.success}; margin-top: 8px; text-align: center; font-weight: 600;">
          ✓ This checklist has been completed and all documents are processed
        </div>
      </div>

      <!-- Document Details -->
      <div class="section-card">
        <div class="section-title">Document Details (${safeDocumentStats.total} documents)</div>
        <div class="table-container">
          <table class="document-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Document Name</th>
                <th>Status</th>
                <th>Checker Status</th>
                <th>Co Comment</th>
                <th>Expiry Date</th>
                <th>Expiry Status</th>
                <th>Deferral No</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              ${safeDocs
                .map((doc, index) => {
                  const statusColor = getStatusColor(doc.status || doc.action);
                  const checkerStatusColor = getStatusColor(doc.checkerStatus || doc.finalCheckerStatus);

                  let statusLabel = "N/A";
                  if (doc.status || doc.action) {
                    const status = doc.status || doc.action;
                    if (status === "deferred" && doc.deferralNumber) {
                      statusLabel = `DEFERRED (${doc.deferralNumber})`;
                    } else {
                      statusLabel = status.toUpperCase();
                    }
                  }

                  let checkerStatusLabel = doc.checkerStatus || doc.finalCheckerStatus || "APPROVED";
                  if (checklist?.status === "approved" || checklist?.status === "completed") {
                    checkerStatusLabel = "APPROVED";
                  } else if (checklist?.status === "rejected") {
                    checkerStatusLabel = "REJECTED";
                  }

                  const expiryStatus = getExpiryStatus(doc.expiryDate);
                  const expiryDate = doc.expiryDate
                    ? dayjs(doc.expiryDate).format("DD/MM/YYYY")
                    : "—";

                  const truncate = (text, max = 40) => {
                    if (!text || text === "—") return "—";
                    return text.length > max
                      ? text.substring(0, max) + "..."
                      : text;
                  };

                  const docName = truncate(doc.name || doc.documentName || "—", 35);
                  const docComment = truncate(doc.comment || "—", 30);
                  const docCategory = truncate(doc.category || "—", 20);

                  const hasFile = (doc.fileUrl || doc.uploadData?.fileUrl) ? "✓" : "—";

                  return `
                    <tr>
                      <td title="${doc.category || "—"}">
                        ${docCategory}
                      </td>
                      <td title="${doc.name || "—"}">
                        ${docName}
                      </td>
                      <td>
                        <span class="status-badge" style="
                          background: ${statusColor.bg};
                          color: ${statusColor.color};
                          border-color: ${statusColor.border};
                        ">
                          ${statusLabel.substring(0, 15)}
                        </span>
                      </td>
                      <td>
                        <span class="status-badge" style="
                          background: ${checkerStatusColor.bg};
                          color: ${checkerStatusColor.color};
                          border-color: ${checkerStatusColor.border};
                        ">
                          ${checkerStatusLabel.substring(0, 15)}
                        </span>
                      </td>
                      <td title="${doc.comment || "—"}">
                        ${docComment}
                      </td>
                      <td style="font-family: monospace; font-weight: 500;">
                        ${expiryDate}
                      </td>
                      <td>
                        ${
                          !expiryStatus
                            ? "—"
                            : `<span class="status-badge ${
                                expiryStatus === "current"
                                  ? "current-tag"
                                  : "expired-tag"
                              }">
                                ${expiryStatus === "current" ? "CURRENT" : "EXPIRED"}
                              </span>`
                        }
                      </td>
                      <td style="font-family: monospace; font-weight: 600;">
                        ${doc.deferralNumber || doc.deferralNo || "—"}
                      </td>
                      <td style="text-align: center; font-weight: bold; color: ${
                        hasFile === "✓"
                          ? bankColors.success
                          : bankColors.textLight
                      };">
                        ${hasFile}
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>
          <strong>COMPLETED CHECKLIST REPORT</strong> • 
          Document Control System • 
          Generated on ${dayjs().format("DD MMM YYYY, HH:mm:ss")}
        </div>
        <div class="disclaimer">
          This is a system-generated document for completed checklists. For official purposes only.
          Any unauthorized reproduction or distribution is strictly prohibited.
          DCL: ${checklist?.dclNo || "N/A"} • Customer: ${checklist?.customerNumber || "N/A"}
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(pdfContainer);

    // Wait for DOM to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Convert to canvas then to PDF
    const canvas = await html2canvas.default(pdfContainer, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      width: pdfContainer.offsetWidth,
      height: pdfContainer.scrollHeight,
      windowHeight: pdfContainer.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const imgWidth = 297;
    const pageHeight = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const fileName = `Completed_Checklist_${
      checklist?.dclNo || checklist?.customerNumber || "export"
    }_${dayjs().format("YYYYMMDD_HHmm")}.pdf`;
    pdf.save(fileName);

    // Clean up
    document.body.removeChild(pdfContainer);

    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};