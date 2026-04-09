import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Side-effect import to register autoTable
import { format } from 'date-fns';

// Import logo - make sure this path is correct
import ncbaLogoPNG from '../assets/ncbabanklogo.png';

/**
 * Generate a professional checklist PDF with NCBA branding
 */
export const generateChecklistPDF = async ({
  checklist,
  documents = [],
  supportingDocs = [],
  creatorComment = '',
  comments = [],
  fileName: customFileName,
}) => {
  return new Promise((resolve, reject) => {
    try {
      // Normalize comments - handle both direct array and wrapped data property
      const rawComments = Array.isArray(comments)
        ? comments
        : (comments?.data && Array.isArray(comments.data))
        ? comments.data
        : [];
     
      // Filter out system-generated logs, keep only user comments
      // System logs contain:
      // - Keywords: Approved, Returned, submitted, updated, saved, created, changed, etc.
      // - File uploads: "Supporting Document uploaded", "Document uploaded", ".pdf", ".jpg", etc.
      // - Role-based actions: "by Co-Creator", "by RM", etc.
      const systemLogPatterns = [
        /^(Checklist|Draft|Document|Status|User|Extension|Email)\s/i,
        /\s(by|from|to)\s(Co-Creator|RM|Checker|Creator|Approver|System)\b/i,
        /(uploaded|submission|updated by|saved by|created by|deleted by|rejected by|approved by|submitted by)\b/i,
        /^(.*)\s(approved|submitted|saved|created|updated|deleted|rejected|sent|uploaded)\s(by|from)\s/i,
        /(Supporting Document|Document)\s(uploaded|added|removed|deleted|changed)/i,
        /\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|txt)\b/i, // File extensions
        /DCL_|checklist_|document_/i, // System file naming
      ];
     
      const isSystemLog = (message) => {
        if (!message || typeof message !== 'string') return false;
        return systemLogPatterns.some(pattern => pattern.test(message));
      };
     
      // Clean message text by removing role prefix labels (e.g., "RM Comment:", "Creator Comment:", etc.)
      const cleanMessageText = (message) => {
        if (!message || typeof message !== 'string') return message;
        // Remove common role prefixes like "RM Comment:", "Co-Creator Comment:", "Checker Comment:", etc.
        return message.replace(/^(RM|Co-Creator|Checker|Creator|Approver|System)\s+(Comment|Message|Note):\s*/i, '').trim();
      };
     
      const normalizedComments = rawComments
        .filter(comment => !isSystemLog(comment.message))
        .map(comment => ({
          ...comment,
          message: cleanMessageText(comment.message || comment.comment)
        }));
     
      console.log('📄 Starting PDF generation...');
      console.log('📝 Raw activity logs:', rawComments.length, 'total');
      console.log('📝 User-typed comments (filtered):', normalizedComments.length);
      if (normalizedComments.length > 0) {
        console.log('📝 First user comment:', normalizedComments[0]);
      }
     
      // Create PDF document with better quality settings
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true,
      });

      console.log('✅ PDF document created');

      // Set default font to helvetica (clean modern style)
      doc.setFont('helvetica', 'normal');

      // Define consistent margins for entire PDF
      const MARGIN_LEFT = 15;
      const MARGIN_RIGHT = 15;
      const PAGE_WIDTH = 210;
      const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 180mm
      const MARGIN_RIGHT_POS = PAGE_WIDTH - MARGIN_RIGHT;

      // Add NCBA logo - aligned to right margin
      try {
        // Check if logo exists and is a string
        if (ncbaLogoPNG) {
          // For Vite/Webpack, the imported image might be a URL path
          // We need to load it as an image first
          const logoImage = new Image();
          logoImage.src = ncbaLogoPNG;
         
          // Use setTimeout to ensure image is loaded
          // For simplicity, we'll try to add it directly
          // If it fails, we'll continue without logo
          try {
            const logoWidth = 35;
            const logoHeight = 10;
            // 8mm from right edge
            doc.addImage(ncbaLogoPNG, 'PNG', PAGE_WIDTH - 8 - logoWidth, 10, logoWidth, logoHeight);
            console.log('✅ Logo added successfully');
          } catch (imgError) {
            console.warn('⚠️ Could not add logo directly, continuing without it:', imgError);
          }
        } else {
          console.warn('⚠️ No logo found, continuing without it');
        }
      } catch (logoError) {
        console.warn('⚠️ Could not add logo, continuing without it:', logoError);
      }

      // Header with title and date
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Document Checklist', 105, 18, { align: 'center' });

      // Document number and date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40); // Body text color - darker for visibility
     
      const dclNo = checklist?.dclNo || checklist?._id || 'N/A';
      const today = format(new Date(), 'dd/MM/yyyy');
     
      doc.text(`DCL No: ${dclNo}`, MARGIN_LEFT, 30);
      doc.text(`Generated: ${today}`, MARGIN_LEFT, 36);

      // Horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(MARGIN_LEFT, 40, MARGIN_RIGHT_POS, 40);

      // Checklist Information Section
      let yPos = 50;
     
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Checklist Information', MARGIN_LEFT, yPos);
     
      yPos += 8;

      // Create info table with better styling
      if (typeof doc.autoTable === 'function') {
        console.log('Using autoTable for table generation');
        doc.autoTable({
          startY: yPos,
          head: [],
          body: [
            ['Customer Name', checklist?.customerName || 'N/A', 'Customer Number', checklist?.customerNumber || 'N/A'],
            ['Loan Type', checklist?.loanType || 'N/A', 'RM Name', checklist?.assignedToRM?.name || checklist?.rmName || 'N/A'],
            ['Status', checklist?.status || 'N/A', 'Created Date', checklist?.createdAt ? format(new Date(checklist.createdAt), 'dd/MM/yyyy') : 'N/A'],
          ],
          theme: 'plain',
          styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: [40, 40, 40],
            font: 'helvetica',
          },
          bodyStyles: {
            textColor: [40, 40, 40],
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 44, fontStyle: 'bold', textColor: [40, 40, 40] },
            1: { cellWidth: 46, textColor: [40, 40, 40] },
            2: { cellWidth: 44, fontStyle: 'bold', textColor: [40, 40, 40] },
            3: { cellWidth: 46, textColor: [40, 40, 40] },
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          didDrawCell: (data) => {
            // Make label cells (even columns) have light blue background
            if (data.column.index % 2 === 0 && data.section === 'body') {
              data.cell.styles.fillColor = [230, 240, 250]; // Light blue background
              data.cell.styles.textColor = [22, 70, 121]; // Blue text for labels
            }
          },
        });

        yPos = doc.lastAutoTable.finalY + 8;
      }

      // Document Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Document Summary', MARGIN_LEFT, yPos);
      yPos += 6;

      yPos += 2;

      // Documents Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Required Documents', MARGIN_LEFT, yPos);
     
      yPos += 8;

      const formatText = (text) => {
        if (!text) return 'N/A';
        const s = String(text).trim();
        if (s.length === 0) return 'N/A';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      };

      const formatStatusValue = (value, fallback = 'pending') => {
        if (!value) return fallback;
        return String(value).trim() || fallback;
      };

      // Prepare documents table with workflow status values
      const docRows = documents.map((doc_item) => [
        (doc_item.category || 'N/A').toUpperCase(),
        doc_item.documentName || doc_item.name || 'N/A',
        formatStatusValue(doc_item.status || doc_item.coStatus, 'pendingco'),
        formatText(doc_item.checkerStatus || doc_item.finalCheckerStatus || 'PENDING'),
        formatText(doc_item.comment || doc_item.remarks || doc_item.coComment || 'OK'),
        doc_item.expiryDate ? format(new Date(doc_item.expiryDate), 'yyyy-MM-dd') : '—',
      ]);

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: yPos,
          head: [['CATEGORY', 'DOCUMENT NAME', 'STATUS', 'CHECKER STATUS', 'CO COMMENT', 'EXPIRY DATE']],
          body: docRows,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            font: 'helvetica',
            valign: 'middle'
          },
          headStyles: {
            fillColor: [26, 54, 93], // Dark Navy
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center',
            font: 'helvetica'
          },
          columnStyles: {
            0: { cellWidth: 27, overflow: 'linebreak' },
            1: { cellWidth: 48, overflow: 'linebreak' },
            2: { cellWidth: 24, halign: 'center', overflow: 'ellipsize' },
            3: { cellWidth: 24, halign: 'center', overflow: 'ellipsize' },
            4: { cellWidth: 28, overflow: 'ellipsize' },
            5: { cellWidth: 24, halign: 'center', overflow: 'ellipsize' },
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          willDrawCell: (data) => {
            if ((data.column.index === 2 || data.column.index === 3) && data.section === 'body') {
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
        yPos = doc.lastAutoTable.finalY + 10;
      } else {
        yPos += 30;
      }

      // Supporting Documents Section (if any)
      if (supportingDocs && supportingDocs.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
        doc.text('Supporting Documents', MARGIN_LEFT, yPos);
       
        yPos += 8;

        const supportingRows = supportingDocs.map((doc, index) => [
          (index + 1).toString(),
          doc.name || doc.fileName || 'N/A',
          doc.uploadedByRole || 'N/A',
          doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd/MM/yyyy') : 'N/A',
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: yPos,
            head: [['#', 'Document Name', 'Uploaded By', 'Date Uploaded']],
            body: supportingRows,
            theme: 'grid',
            styles: {
              fontSize: 7,
              cellPadding: 2,
              lineColor: [22, 70, 121],
              textColor: [40, 40, 40], // Body text color - darker for visibility
              font: 'helvetica',
            },
            headStyles: {
              fillColor: [22, 70, 121], // PRIMARY_BLUE
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7,
              font: 'helvetica',
            },
            columnStyles: {
              0: { cellWidth: 14 },
              1: { cellWidth: 62 },
              2: { cellWidth: 40 },
              3: { cellWidth: 48 },
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        } else {
          yPos += 25;
        }
      }

      // Comments Section - Simplified with necessary info only
      if (normalizedComments && normalizedComments.length > 0) {
        console.log('✅ Rendering Comment Trail with', normalizedComments.length, 'comments');
       
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
        doc.text('Comment Trail', MARGIN_LEFT, yPos);
       
        yPos += 8;

        const isSystemMessage = (text) => {
          if (!text) return true;
          const msg = text.toLowerCase();
          const patterns = [
            "submitted to", "returned to", "approved by", "rejected by",
            "completed", "status updated", "initiated", "submitted for",
            "sent to", "assigned to", "checklist updated", "documents updated",
            "status changed", "checklist submitted", "checklist moved", "auto-generated"
          ];
          return patterns.some(p => msg.includes(p));
        };

        // Only include non-system user comments
        const commentRows = normalizedComments
          .filter(c => {
            const role = (c.user?.role || c.role || '').toLowerCase();
            if (role === 'system') return false;
            const msg = (c.message || c.text || c.comment || '');
            return !isSystemMessage(msg);
          })
          .map((comment, idx) => {
          const dateStr = comment.createdAt ? format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A';
          const userName = comment.user?.name || comment.userName || 'N/A';
         
          const role = (comment.user?.role || comment.role || 'N/A').toLowerCase();
          let formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
          if (role === 'cocreator') formattedRole = 'CO Creator';
          if (role === 'cochecker') formattedRole = 'CO Checker';
          if (role === 'rm') formattedRole = 'RM';

          const message = comment.message || comment.text || comment.comment || '-';
         
          console.log(`  📝 Comment ${idx + 1}: [${dateStr}] ${userName} (${formattedRole}): ${message?.substring(0, 30)}...`);
         
          return [userName, formattedRole, dateStr, message];
        });

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: yPos,
            head: [['User', 'Role', 'Date', 'Comment']],
            body: commentRows,
            theme: 'grid',
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              font: 'helvetica',
              lineColor: [22, 70, 121],
              textColor: [40, 40, 40], // Body text color - darker for visibility
            },
            headStyles: {
              fillColor: [22, 70, 121], // PRIMARY_BLUE
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8,
              font: 'helvetica',
            },
            columnStyles: {
              0: { cellWidth: 35, fontStyle: 'bold' },
              1: { cellWidth: 25 },
              2: { cellWidth: 30 },
              3: { cellWidth: 90 },
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        } else {
          yPos += 30;
        }
      }

      // Creator Comment
      if (creatorComment) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
        doc.text('Creator Comment:', MARGIN_LEFT, yPos);
       
        yPos += 6;
       
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
       
        const splitComment = doc.splitTextToSize(creatorComment, USABLE_WIDTH);
        doc.text(splitComment, MARGIN_LEFT, yPos);
       
        yPos += splitComment.length * 5 + 5;
      }

      // Footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        // Background bar
        doc.setFillColor(245, 247, 244);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

        doc.setFontSize(7);
        doc.setTextColor(64, 83, 76);
        doc.setFont('helvetica', 'normal');
       
        const generatedBy = checklist?.createdBy?.name || "System";
        const generatedOn = format(new Date(), 'dd/MM/yyyy HH:mm:ss');

        // Center
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
       
        // Right
        doc.text(`Generated by ${generatedBy} on ${generatedOn}`, pageWidth - MARGIN_RIGHT, pageHeight - 5, { align: 'right' });
      }

      // Generate filename
      const fileName = customFileName ||
        `checklist_${checklist?.dclNo || checklist?._id || 'document'}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;

      // Save the PDF
      doc.save(fileName);

      console.log(`✅ PDF generated successfully: ${fileName}`);
     
      resolve({
        success: true,
        fileName,
        fileUrl: null, // No URL, just downloaded
      });
    } catch (error) {
      console.error('❌ Error in PDF generation:', error);
      reject(error);
    }
  })
};