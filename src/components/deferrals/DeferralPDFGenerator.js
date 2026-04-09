// src/components/DeferralPDFGenerator.js
import { jsPDF } from "jspdf";

export function generateDeferralPDF({
  customerData,
  selectedDocuments,
  approvers,
  uploadedFiles,
}) {
  if (!customerData) {
    alert("No customer data available to generate PDF.");
    return;
  }

  const doc = new jsPDF();

  // TITLE
  doc.setFontSize(20);
  doc.text("Deferral Request", 105, 20, { align: "center" });

  // CUSTOMER INFO
  doc.setFontSize(12);
  doc.text("Customer Information", 20, 40);
  doc.text(`Name: ${customerData.name}`, 20, 50);
  doc.text(`Business Name: ${customerData.businessName}`, 20, 60);
  doc.text(`Customer Number: ${customerData.customerNumber}`, 20, 70);
  doc.text(`Account Number: ${customerData.accountNumber}`, 20, 80);
  doc.text(`Loan Type: ${customerData.loanType}`, 20, 90);

  // APPROVERS
  doc.text("Approvers", 20, 110);
  approvers.forEach((approver, index) => {
    doc.text(
      `${index + 1}. ${approver || "Not Assigned"}`,
      25,
      120 + index * 10
    );
  });

  // SELECTED DOCUMENTS
  let docStartY = 140 + approvers.length * 10;
  doc.text("Selected Documents", 20, docStartY);
  selectedDocuments.forEach((docItem, index) => {
    doc.text(
      `${index + 1}. ${docItem.name || docItem}`,
      25,
      docStartY + 10 + index * 10
    );
  });

  // UPLOADED FILES
  let fileStartY = docStartY + 10 + selectedDocuments.length * 10;
  doc.text("Uploaded Files", 20, fileStartY);
  if (uploadedFiles && uploadedFiles.length > 0) {
    uploadedFiles.forEach((file, index) => {
      doc.text(
        `${index + 1}. ${file.name} (${file.type || "Unknown Type"})`,
        25,
        fileStartY + 10 + index * 10
      );
    });
  } else {
    doc.text("No files uploaded", 25, fileStartY + 10);
  }

  // FOOTER
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);

  // SAVE PDF
  doc.save(`Deferral_${customerData.customerNumber}.pdf`);
}
