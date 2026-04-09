/**
 * Actioned Module - PDF Generation Utility
 * Generates comprehensive PDF reports of actioned deferrals
 */

import jsPDF from "jspdf";
import dayjs from "dayjs";
import { message } from "antd";
import { getLoanDisplay } from "../../../../utils/loanUtils";
import {
  PRIMARY_BLUE_RGB,
  SECONDARY_PURPLE_RGB,
  SUCCESS_GREEN_RGB,
  WARNING_ORANGE_RGB,
  ERROR_RED_RGB,
  DARK_GRAY,
  LIGHT_GRAY,
} from "./constants";
import { getApproverStats } from "./helpers";

/**
 * Downloads a deferral as a comprehensive PDF report
 * @param {Object} deferral - The deferral object to export
 * @throws {Error} - If PDF generation fails
 */
export const downloadDeferralAsPDF = async (deferral) => {
  try {
    if (!deferral) {
      message.error("No deferral selected");
      return;
    }

    const doc = new jsPDF();
    let yPosition = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    /**
     * Helper to add a section with title and items
     * @param {string} title - Section title
     * @param {Array} items - [{label, value}, ...]
     * @returns {number} - Updated yPosition
     */
    const addCardSection = (title, items) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 15;
      }

      // Section header background
      doc.setFillColor(
        PRIMARY_BLUE_RGB[0],
        PRIMARY_BLUE_RGB[1],
        PRIMARY_BLUE_RGB[2],
      );
      doc.rect(margin, yPosition, contentWidth, 10, "F");

      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.text(title, margin + 5, yPosition + 7);
      yPosition += 12;

      const itemHeight = 7;
      items.forEach((item, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        // Alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 2, contentWidth, itemHeight, "F");
        }

        // Label
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(
          SECONDARY_PURPLE_RGB[0],
          SECONDARY_PURPLE_RGB[1],
          SECONDARY_PURPLE_RGB[2],
        );
        doc.text(item.label + ":", margin + 5, yPosition + 3);

        // Value
        doc.setTextColor(
          PRIMARY_BLUE_RGB[0],
          PRIMARY_BLUE_RGB[1],
          PRIMARY_BLUE_RGB[2],
        );
        doc.text(item.value, margin + 50, yPosition + 3, {
          maxWidth: contentWidth - 55,
        });

        yPosition += itemHeight;
      });

      yPosition += 4;
      return yPosition;
    };

    // ===== PAGE HEADER =====
    doc.setFillColor(
      PRIMARY_BLUE_RGB[0],
      PRIMARY_BLUE_RGB[1],
      PRIMARY_BLUE_RGB[2],
    );
    doc.rect(0, 0, pageWidth, 15, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, "bold");
    doc.text(
      `Deferral Request: ${deferral.deferralNumber || "N/A"}`,
      margin,
      10,
    );
    yPosition = 25;

    // ===== CUSTOMER INFORMATION =====
    const customerItems = [
      { label: "Customer Name", value: deferral.customerName || "N/A" },
      { label: "Customer Number", value: deferral.customerNumber || "N/A" },
      { label: "Loan Type", value: deferral.loanType || "N/A" },
    ];
    yPosition = addCardSection("Customer Information", customerItems);

    // ===== DEFERRAL DETAILS =====
    const stats = getApproverStats(deferral);
    const deferralDetailsItems = [
      { label: "Deferral Number", value: deferral.deferralNumber || "N/A" },
      {
        label: "DCL No",
        value: deferral.dclNo || deferral.dclNumber || "N/A",
      },
      { label: "Status", value: deferral.status || "Pending" },
      {
        label: "Creator Status",
        value: deferral.creatorApprovalStatus || "Pending",
      },
      {
        label: "Creator Date",
        value: deferral.creatorApprovalDate
          ? dayjs(deferral.creatorApprovalDate).format("DD/MM/YY")
          : "N/A",
      },
      {
        label: "Checker Status",
        value: deferral.checkerApprovalStatus || "Pending",
      },
      {
        label: "Checker Date",
        value: deferral.checkerApprovalDate
          ? dayjs(deferral.checkerApprovalDate).format("DD/MM/YY")
          : "N/A",
      },
      {
        label: "Approvers Status",
        value: `${stats.approved} of ${stats.total} Approved`,
      },
      {
        label: "Created At",
        value: dayjs(deferral.createdAt).format("DD MMM YYYY HH:mm"),
      },
    ];
    yPosition = addCardSection("Deferral Details", deferralDetailsItems);

    // ===== LOAN INFORMATION =====
    const { classification } = getLoanDisplay(deferral);
    const loanItems = [];
    if (classification) {
      loanItems.push({ label: "Loan Classification", value: classification });
    }
    loanItems.push({
      label: "Days Sought",
      value: `${deferral.daysSought || 0} days`,
    });
    loanItems.push({
      label: "Deferral Due Date",
      value:
        deferral.nextDueDate || deferral.nextDocumentDueDate
          ? dayjs(
              deferral.nextDueDate || deferral.nextDocumentDueDate,
            ).format("DD MMM YYYY")
          : "Not calculated",
    });
    loanItems.push({
      label: "SLA Expiry",
      value: deferral.slaExpiry
        ? dayjs(deferral.slaExpiry).format("DD MMM YYYY")
        : "Not set",
    });
    yPosition = addCardSection("Loan Information", loanItems);

    // ===== FACILITIES =====
    if (deferral.facilities && deferral.facilities.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFillColor(
        PRIMARY_BLUE_RGB[0],
        PRIMARY_BLUE_RGB[1],
        PRIMARY_BLUE_RGB[2],
      );
      doc.rect(margin, yPosition, contentWidth, 10, "F");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.text("Facilities", margin + 5, yPosition + 7);
      yPosition += 12;

      // Table header
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(
        PRIMARY_BLUE_RGB[0],
        PRIMARY_BLUE_RGB[1],
        PRIMARY_BLUE_RGB[2],
      );
      doc.text("Type", margin + 5, yPosition + 5);
      doc.text("Sanctioned", margin + 70, yPosition + 5);
      doc.text("Outstanding", margin + 115, yPosition + 5);
      doc.text("Headroom", margin + 160, yPosition + 5);
      yPosition += 10;

      deferral.facilities.forEach((facility, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 2, contentWidth, 8, "F");
        }

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
        doc.text(
          facility.type || facility.facilityType || "N/A",
          margin + 5,
          yPosition + 3,
        );
        doc.text(
          String(facility.sanctionedAmount || "0"),
          margin + 70,
          yPosition + 3,
        );
        doc.text(
          String(facility.outstandingAmount || "0"),
          margin + 115,
          yPosition + 3,
        );
        doc.text(
          String(facility.headroom || "0"),
          margin + 160,
          yPosition + 3,
        );
        yPosition += 8;
      });

      yPosition += 4;
    }

    // ===== DEFERRAL DESCRIPTION =====
    if (deferral.deferralDescription || deferral.description) {
      const descText =
        deferral.deferralDescription || deferral.description || "";
      yPosition = addCardSection("Deferral Description", [
        { label: "Description", value: descText },
      ]);
    }

    // ===== APPROVAL FLOW =====
    const approvalFlow =
      Array.isArray(deferral.approverFlow) && deferral.approverFlow.length > 0
        ? deferral.approverFlow
        : Array.isArray(deferral.approvers)
          ? deferral.approvers
          : [];

    if (approvalFlow.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFillColor(
        PRIMARY_BLUE_RGB[0],
        PRIMARY_BLUE_RGB[1],
        PRIMARY_BLUE_RGB[2],
      );
      doc.rect(margin, yPosition, contentWidth, 10, "F");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.text("Approval Flow", margin + 5, yPosition + 7);
      yPosition += 12;

      approvalFlow.forEach((approver, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 2, contentWidth, 12, "F");
        }

        const approverName =
          approver.name ||
          approver.user?.name ||
          approver.email ||
          `Approver ${index + 1}`;
        const status = approver.approved
          ? "Approved"
          : approver.rejected
            ? "Rejected"
            : approver.returned
              ? "Returned"
              : "Pending";
        const date =
          approver.approvedDate ||
          approver.rejectedDate ||
          approver.returnedDate ||
          approver.approvedAt ||
          "";
        const statusColor =
          status === "Approved"
            ? SUCCESS_GREEN_RGB
            : status === "Rejected"
              ? ERROR_RED_RGB
              : WARNING_ORANGE_RGB;

        // Status indicator
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.circle(margin + 5, yPosition + 3, 3.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, "bold");
        doc.text(String(index + 1), margin + 2.5, yPosition + 4);

        // Approver name
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
        doc.text(approverName, margin + 15, yPosition + 3);

        // Status
        doc.setFont(undefined, "normal");
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(status, margin + 100, yPosition + 3);

        // Date
        if (date) {
          doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
          doc.setFontSize(8);
          doc.text(
            dayjs(date).format("DD MMM YYYY HH:mm"),
            margin + 135,
            yPosition + 3,
          );
        }

        yPosition += 12;
      });

      yPosition += 4;
    }

    // ===== ATTACHED DOCUMENTS =====
    if (deferral.documents && deferral.documents.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFillColor(
        PRIMARY_BLUE_RGB[0],
        PRIMARY_BLUE_RGB[1],
        PRIMARY_BLUE_RGB[2],
      );
      doc.rect(margin, yPosition, contentWidth, 10, "F");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.text("Attached Documents", margin + 5, yPosition + 7);
      yPosition += 12;

      deferral.documents.forEach((docItem, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 2, contentWidth, 10, "F");
        }

        const docName = docItem.name || `Document ${index + 1}`;
        const fileExt = docName.split(".").pop().toLowerCase();
        const fileColor =
          fileExt === "pdf"
            ? ERROR_RED_RGB
            : fileExt === "xlsx" || fileExt === "xls"
              ? SUCCESS_GREEN_RGB
              : PRIMARY_BLUE_RGB;

        doc.setFillColor(fileColor[0], fileColor[1], fileColor[2]);
        doc.circle(margin + 5, yPosition + 3, 2.5, "F");

        doc.setFontSize(9);
        doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
        doc.setFont(undefined, "normal");
        doc.text(docName, margin + 12, yPosition + 3, {
          maxWidth: contentWidth - 50,
        });

        if (docItem.fileSize) {
          doc.setFontSize(8);
          doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
          doc.text(
            `(${(docItem.fileSize / 1024).toFixed(2)} KB)`,
            margin + 155,
            yPosition + 3,
          );
        }

        yPosition += 10;
      });

      yPosition += 4;
    }

    // ===== COMMENT TRAIL =====
    if (deferral.comments && deferral.comments.length > 0) {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFillColor(
        PRIMARY_BLUE_RGB[0],
        PRIMARY_BLUE_RGB[1],
        PRIMARY_BLUE_RGB[2],
      );
      doc.rect(margin, yPosition, contentWidth, 10, "F");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.text("Comment Trail", margin + 5, yPosition + 7);
      yPosition += 12;

      deferral.comments.forEach((comment, index) => {
        const authorName =
          comment.author?.name || comment.authorName || "User";
        const authorRole = comment.author?.role || comment.role || "N/A";
        const commentText = comment.text || comment.comment || "";
        const commentDate = comment.createdAt
          ? dayjs(comment.createdAt).format("DD MMM YYYY HH:mm")
          : "";

        const commentLines = doc.splitTextToSize(
          commentText,
          contentWidth - 25,
        );
        const commentBoxHeight = commentLines.length * 6 + 18;

        if (yPosition + commentBoxHeight > 270) {
          doc.addPage();
          yPosition = 15;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 252, 255);
          doc.rect(
            margin,
            yPosition - 2,
            contentWidth,
            commentBoxHeight,
            "F",
          );
        }

        // Commenter avatar
        doc.setFillColor(
          PRIMARY_BLUE_RGB[0],
          PRIMARY_BLUE_RGB[1],
          PRIMARY_BLUE_RGB[2],
        );
        doc.circle(margin + 5, yPosition + 3, 3, "F");
        const initials = authorName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont(undefined, "bold");
        doc.text(initials, margin + 2.3, yPosition + 4);

        // Author info
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
        doc.text(authorName, margin + 13, yPosition + 3);

        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
        doc.text(`(${authorRole})`, margin + 60, yPosition + 3);
        doc.text(commentDate, margin + 115, yPosition + 3);

        yPosition += 10;

        // Comment text
        doc.setFontSize(9);
        doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
        commentLines.forEach((line) => {
          doc.text(line, margin + 13, yPosition);
          yPosition += 6;
        });

        yPosition += 4;
      });
    }

    // ===== FOOTER =====
    yPosition += 8;
    doc.setFont(undefined, "italic");
    doc.setFontSize(9);
    doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
    doc.text(
      `Generated on: ${dayjs().format("DD MMM YYYY HH:mm")}`,
      margin,
      yPosition,
    );
    doc.text("This is a system-generated report.", margin, yPosition + 6);

    // Download
    doc.save(
      `Deferral_${deferral.deferralNumber}_${dayjs().format("YYYYMMDD")}.pdf`,
    );
    message.success("Deferral downloaded as PDF successfully!");
  } catch (error) {
    console.error("PDF generation failed:", error);
    message.error("Failed to generate PDF");
  }
};
