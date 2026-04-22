import React, { useState } from "react";
import { Button, message } from "antd";
import { FilePdfOutlined as PdfIcon } from "@ant-design/icons";
import "./actionButtonStyles.css";
import { generateChecklistPDF } from "../../../utils/reportGenerator";

const PdfExportButton = ({ checklist, docs, documentStats, comments = [] }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      generateChecklistPDF(checklist, docs, documentStats, comments?.data || comments || []);
      message.success("Checklist downloaded as PDF successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Button
      key="download"
      type="primary"
      className="rm-review-action-button"
      icon={<PdfIcon />}
      loading={isGeneratingPDF}
      onClick={handleDownloadPDF}
      disabled={isGeneratingPDF}
      style={{ marginRight: 8 }}
    >
      Download PDF
    </Button>
  );
};

export default PdfExportButton;